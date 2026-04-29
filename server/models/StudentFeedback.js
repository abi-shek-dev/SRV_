import pool from '../db/pool.js';

const r2sf = (r) => !r ? null : {
  _id: r.id, id: r.id,
  studentId: r.student_id, facultyId: r.faculty_id,
  ratings: { teachingQuality: r.rating_teaching, communication: r.rating_communication, support: r.rating_support },
  comments: r.comments,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}) {
  const colMap = { studentId: 'student_id', facultyId: 'faculty_id' };
  let sql = 'SELECT * FROM student_feedback';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) { conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  const [rows] = await pool.query(sql, vals);
  return rows.map(r2sf);
}

export async function create(data) {
  const { studentId, facultyId, ratings = {}, comments } = data;
  const [result] = await pool.query(
    `INSERT INTO student_feedback (student_id, faculty_id, rating_teaching, rating_communication, rating_support, comments)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [studentId, facultyId, ratings.teachingQuality, ratings.communication, ratings.support, comments || null]
  );
  const [rows] = await pool.query('SELECT * FROM student_feedback WHERE id = ?', [result.insertId]);
  return r2sf(rows[0]);
}

export default { find, create };
