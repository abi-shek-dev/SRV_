import pool from '../db/pool.js';

const row2hw = (r) => !r ? null : {
  _id: r.id, id: r.id,
  facultyId: r.faculty_id, grade: r.grade, section: r.section,
  subject: r.subject, title: r.title, description: r.description,
  dueDate: r.due_date, assignedDate: r.assigned_date,
  submissionDeadline: r.submission_deadline,
  archived: Boolean(r.archived),
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}, opts = {}) {
  const colMap = { facultyId: 'faculty_id', grade: 'grade', section: 'section',
                   subject: 'subject', archived: 'archived', dueDate: 'due_date', createdAt: 'created_at' };
  let sql = 'SELECT * FROM homework';
  const vals = [];
  const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      // Handle compound operators like { $gte: x, $lte: y }
      if (v['$gte'] !== undefined) { conds.push(`\`${col}\` >= ?`); vals.push(v['$gte']); }
      if (v['$lte'] !== undefined) { conds.push(`\`${col}\` <= ?`); vals.push(v['$lte']); }
      if (v['$lt'] !== undefined)  { conds.push(`\`${col}\` < ?`);  vals.push(v['$lt']); }
      if (v['$ne'] !== undefined)  { conds.push(`\`${col}\` != ?`); vals.push(v['$ne']); }
    } else {
      conds.push(`\`${col}\` = ?`); vals.push(v);
    }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += opts.sort ? ` ORDER BY ${opts.sort}` : ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return rows.map(row2hw);
}


export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM homework WHERE id = ? LIMIT 1', [id]);
  return row2hw(rows[0]);
}

export async function findOneAndUpdate(where, update, opts = {}) {
  const colMap = { facultyId: 'faculty_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM homework WHERE ${conds} LIMIT 1`, Object.values(where));
  if (!rows[0]) return null;
  const id = rows[0].id;
  const setData = update['$set'] || update;
  const updColMap = { subject: 'subject', title: 'title', description: 'description',
                      dueDate: 'due_date', archived: 'archived', submissionDeadline: 'submission_deadline' };
  const fields = {};
  for (const [k, v] of Object.entries(setData)) { fields[updColMap[k] || k] = v; }
  if (Object.keys(fields).length) {
    const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
    await pool.query(`UPDATE homework SET ${setClauses} WHERE id = ?`, [...Object.values(fields), id]);
  }
  return findById(id);
}

export async function create(data) {
  const { facultyId, grade, section, subject, title, description, dueDate, assignedDate, archived = false, submissionDeadline } = data;
  const [result] = await pool.query(
    `INSERT INTO homework (faculty_id, grade, section, subject, title, description, due_date, assigned_date, archived, submission_deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [facultyId, grade, section, subject, title, description, dueDate,
     assignedDate || new Date(), archived ? 1 : 0, submissionDeadline || null]
  );
  return findById(result.insertId);
}

export async function updateMany(where, update) {
  const colMap = { grade: 'grade', section: 'section', facultyId: 'faculty_id', archived: 'archived', createdAt: 'created_at', dueDate: 'due_date' };
  const setData = update['$set'] || update;
  const fields = {};
  for (const [k, v] of Object.entries(setData)) { fields[colMap[k] || k] = v; }
  const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
  const vals = [...Object.values(fields)];
  let sql = `UPDATE homework SET ${setClauses}`;
  const conds = [];
  for (const [k, v] of Object.entries(where)) {
    if (v && v['$lt'] !== undefined) { conds.push(`\`${colMap[k] || k}\` < ?`); vals.push(v['$lt']); }
    else if (v && v['$ne'] !== undefined) { conds.push(`\`${colMap[k] || k}\` != ?`); vals.push(v['$ne']); }
    else { conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  const [result] = await pool.query(sql, vals);
  return { modifiedCount: result.affectedRows };
}

export default { find, findById, findOneAndUpdate, create, updateMany };
