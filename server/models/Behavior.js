import pool from '../db/pool.js';

const row2log = async (r) => {
  if (!r) return null;
  const [recs] = await pool.query('SELECT * FROM behavior_records WHERE log_id = ?', [r.id]);
  return {
    _id: r.id, id: r.id,
    facultyId: r.faculty_id, grade: r.grade, section: r.section, date: r.date,
    records: recs.map(rec => ({ _id: rec.id, studentId: rec.student_id, score: rec.score, remarks: rec.remarks })),
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function findOne(where) {
  const colMap = { facultyId: 'faculty_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM behavior_logs WHERE ${conds} LIMIT 1`, Object.values(where));
  return rows[0] ? row2log(rows[0]) : null;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM behavior_logs WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2log(rows[0]) : null;
}

export async function create(data) {
  const { facultyId, grade, section, date, records = [] } = data;
  const [result] = await pool.query(
    'INSERT INTO behavior_logs (faculty_id, grade, section, date) VALUES (?, ?, ?, ?)',
    [facultyId, grade, section, date]
  );
  const logId = result.insertId;
  await _setRecords(logId, records);
  return findById(logId);
}

export async function save(obj) {
  await _setRecords(obj._id, obj.records || []);
  return findById(obj._id);
}

async function _setRecords(logId, records) {
  await pool.query('DELETE FROM behavior_records WHERE log_id = ?', [logId]);
  if (!records.length) return;
  const rows = records.map(r => [logId, r.studentId, r.score ?? 10, r.remarks || '']);
  await pool.query('INSERT INTO behavior_records (log_id, student_id, score, remarks) VALUES ?', [rows]);
}

export async function find(where = {}) {
  const keys = Object.keys(where);
  let sql = 'SELECT * FROM behavior_logs';
  const params = [];
  if (keys.length > 0) {
    const colMap = { facultyId: 'faculty_id' };
    const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`);
    sql += ' WHERE ' + conds.join(' AND ');
    params.push(...Object.values(where));
  }
  sql += ' ORDER BY date DESC';
  const [rows] = await pool.query(sql, params);
  return Promise.all(rows.map(r => row2log(r)));
}

export default { findOne, findById, find, create, save };
