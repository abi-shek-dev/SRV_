import pool from '../db/pool.js';

const row2fb = (r) => !r ? null : {
  _id: r.id, id: r.id,
  parentId: r.parent_id, studentId: r.student_id, facultyId: r.faculty_id,
  studentName: r.student_name, grade: r.grade, section: r.section,
  category: r.category, subject: r.subject, message: r.message,
  status: r.status, staffNote: r.staff_note, updatedBy: r.updated_by,
  createdAt: r.created_at, updatedAt: r.updated_at
};

const row2fbWithJoins = (r) => !r ? null : {
  _id: r.id, id: r.id,
  parentId: { _id: r.parent_id, name: r.parent_name, srvNumber: r.parent_srv,
               studentId: r.parent_student_id },
  studentId: { _id: r.student_id, name: r.student_name, srvNumber: r.student_srv,
                motherName: r.mother_name, fatherName: r.father_name, guardianName: r.guardian_name },
  facultyId: r.faculty_id ? { _id: r.faculty_id, name: r.faculty_name } : null,
  category: r.category, subject: r.subject, message: r.message,
  status: r.status, staffNote: r.staff_note, updatedBy: r.updated_by,
  createdAt: r.created_at, updatedAt: r.updated_at
};

const JOIN_SQL = `
  SELECT f.*,
    u.name AS parent_name, u.srv_number AS parent_srv, u.student_id AS parent_student_id,
    s.name AS student_name, s.srv_number AS student_srv,
    s.mother_name, s.father_name, s.guardian_name,
    fc.name AS faculty_name
  FROM feedback f
  LEFT JOIN users u  ON u.id  = f.parent_id
  LEFT JOIN students s ON s.id = f.student_id
  LEFT JOIN users fc ON fc.id = f.faculty_id
`;

export async function find(where = {}, opts = {}) {
  const colMap = { facultyId: 'f.faculty_id', parentId: 'f.parent_id', status: 'f.status' };
  let sql = JOIN_SQL;
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`${colMap[k] || `f.${k}`} = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY f.created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return rows.map(row2fbWithJoins);
}

export async function findById(id) {
  const [rows] = await pool.query(`${JOIN_SQL} WHERE f.id = ? LIMIT 1`, [id]);
  return row2fbWithJoins(rows[0]);
}

export async function findOne(where) {
  const colMap = { facultyId: 'f.faculty_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `${colMap[k] || `f.${k}`} = ?`).join(' AND ');
  const [rows] = await pool.query(`${JOIN_SQL} WHERE ${conds} LIMIT 1`, Object.values(where));
  return row2fbWithJoins(rows[0]);
}

export async function create(data) {
  const { parentId, studentId, facultyId, studentName, grade, section,
          category, subject, message, status = 'OPEN', staffNote = '' } = data;
  const [result] = await pool.query(
    `INSERT INTO feedback (parent_id, student_id, faculty_id, student_name, grade, section,
      category, subject, message, status, staff_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parentId, studentId, facultyId || null, studentName, grade, section,
     category, subject, message, status, staffNote]
  );
  return findById(result.insertId);
}

export async function save(obj) {
  await pool.query(
    'UPDATE feedback SET status=?, staff_note=?, updated_by=? WHERE id=?',
    [obj.status, obj.staffNote || '', obj.updatedBy || null, obj._id]
  );
  return findById(obj._id);
}

export async function countDocuments(where = {}) {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM feedback');
  return rows[0].cnt;
}

export default { find, findById, findOne, create, save, countDocuments };
