import pool from '../db/pool.js';

// ── Helpers ──────────────────────────────────────────────
const row2user = (r) => {
  if (!r) return null;
  return {
    _id: r.id,
    id:  r.id,
    name: r.name,
    srvNumber: r.srv_number,
    password: r.password,
    recoveryQuestion: r.recovery_question,
    recoveryAnswerHash: r.recovery_answer_hash,
    role: r.role,
    assignedGrade: r.assigned_grade,
    assignedSection: r.assigned_section,
    mobileNumber: r.mobile_number,
    maxStudents: r.max_students,
    studentId: r.student_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    handledClasses: []   // populated separately when needed
  };
};

const buildSet = (fields) => {
  const keys = Object.keys(fields);
  const sql  = keys.map(k => `\`${k}\` = ?`).join(', ');
  const vals = Object.values(fields);
  return { sql, vals };
};

// ── Queries ───────────────────────────────────────────────
export async function findOne(where) {
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM users WHERE ${conds} LIMIT 1`, Object.values(where));
  return row2user(rows[0]);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  const user = row2user(rows[0]);
  if (user) user.handledClasses = await getHandledClasses(id);
  return user;
}

// Lookup by srv_number (case-insensitive) — for login
export async function findBySrvNumber(srvNumber) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE UPPER(srv_number) = UPPER(?) LIMIT 1', [srvNumber]
  );
  const user = row2user(rows[0]);
  if (user) user.handledClasses = await getHandledClasses(user._id);
  return user;
}

// Lookup admin only by srv_number — for admin-login
export async function findAdminBySrvNumber(srvNumber) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE UPPER(srv_number) = UPPER(?) AND role = 'admin' LIMIT 1", [srvNumber]
  );
  return row2user(rows[0]);
}

export async function findByIdAndSelect(id, fields) {
  // fields is space-separated like 'name srvNumber role'
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return row2user(rows[0]);
}

export async function find(where = {}, opts = {}) {
  let sql = 'SELECT * FROM users';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  if (opts.sort) sql += ` ORDER BY ${opts.sort}`;
  const [rows] = await pool.query(sql, vals);
  return rows.map(row2user);
}

export async function findByRole(role) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', [role]
  );
  const users = rows.map(row2user);
  for (const u of users) {
    u.handledClasses = await getHandledClasses(u._id);
  }
  return users;
}

// Find last user whose srv_number starts with prefix (for auto-increment)
export async function findLastBySrvPrefix(role, prefix) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE role = ? AND srv_number LIKE ? ORDER BY srv_number DESC LIMIT 1',
    [role, `${prefix}%`]
  );
  return row2user(rows[0]);
}


export async function findParentsForStudents(studentIds) {
  if (!studentIds.length) return [];
  const placeholders = studentIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE role = 'parent' AND student_id IN (${placeholders})`, studentIds
  );
  return rows.map(row2user);
}

export async function countDocuments(where = {}) {
  let sql = 'SELECT COUNT(*) AS cnt FROM users';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  const [rows] = await pool.query(sql, vals);
  return rows[0].cnt;
}

export async function create(data) {
  const { name, srvNumber, password, role, assignedGrade, assignedSection,
          mobileNumber, maxStudents, studentId, handledClasses } = data;

  const [result] = await pool.query(
    `INSERT INTO users (name, srv_number, password, role, assigned_grade, assigned_section,
      mobile_number, max_students, student_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, srvNumber, password, role, assignedGrade || null, assignedSection || null,
     mobileNumber || null, maxStudents ?? 30, studentId || null]
  );
  const newId = result.insertId;

  if (Array.isArray(handledClasses) && handledClasses.length) {
    await setHandledClasses(newId, handledClasses);
  }

  return findById(newId);
}

export async function updateById(id, data) {
  const colMap = {
    name:                'name',
    srvNumber:           'srv_number',
    password:            'password',
    recoveryQuestion:    'recovery_question',
    recoveryAnswerHash:  'recovery_answer_hash',
    assignedGrade:       'assigned_grade',
    assignedSection:     'assigned_section',
    mobileNumber:        'mobile_number',
    maxStudents:         'max_students',
    studentId:           'student_id'
  };

  const fields = {};
  for (const [jsKey, sqlCol] of Object.entries(colMap)) {
    if (data[jsKey] !== undefined) fields[sqlCol] = data[jsKey];
  }

  if (Object.keys(fields).length) {
    const { sql, vals } = buildSet(fields);
    await pool.query(`UPDATE users SET ${sql} WHERE id = ?`, [...vals, id]);
  }

  if (data.handledClasses !== undefined) {
    await setHandledClasses(id, data.handledClasses);
  }

  return findById(id);
}

// Save helper for Mongoose-style .save() calls on mutable objects
export async function save(userObj) {
  return updateById(userObj._id, userObj);
}

export async function findByIdAndDelete(id) {
  const user = await findById(id);
  if (user) await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return user;
}

export async function findOneAndDelete(where) {
  const user = await findOne(where);
  if (user) await pool.query('DELETE FROM users WHERE id = ?', [user._id]);
  return user;
}

export async function updateOne(where, set) {
  const colMap = { srvNumber: 'srv_number', name: 'name', password: 'password', role: 'role', studentId: 'student_id' };
  const whereKeys = Object.keys(where);
  const whereSql = whereKeys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const setData = set['$set'] || set;
  const fields = {};
  for (const [k, v] of Object.entries(setData)) {
    fields[colMap[k] || k] = v;
  }
  const { sql, vals } = buildSet(fields);
  await pool.query(
    `UPDATE users SET ${sql} WHERE ${whereSql}`,
    [...vals, ...Object.values(where)]
  );
}


// ── handledClasses helpers ────────────────────────────────
async function getHandledClasses(userId) {
  const [rows] = await pool.query(
    'SELECT grade, section, subject FROM faculty_handled_classes WHERE user_id = ?', [userId]
  );
  return rows;
}

async function setHandledClasses(userId, classes) {
  await pool.query('DELETE FROM faculty_handled_classes WHERE user_id = ?', [userId]);
  if (!classes.length) return;
  const rows = classes.map(c => [userId, c.grade || null, c.section || null, c.subject || null]);
  await pool.query(
    'INSERT INTO faculty_handled_classes (user_id, grade, section, subject) VALUES ?', [rows]
  );
}

export default {
  findOne, findById, findBySrvNumber, findAdminBySrvNumber, findByIdAndSelect, find, findByRole,
  findLastBySrvPrefix, findParentsForStudents, countDocuments, create,
  updateById, save, findByIdAndDelete, findOneAndDelete, updateOne
};
