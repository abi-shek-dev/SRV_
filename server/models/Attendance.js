import pool from '../db/pool.js';

const row2log = async (r) => {
  if (!r) return null;
  const [recs] = await pool.query(
    'SELECT * FROM attendance_records WHERE log_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    facultyId: r.faculty_id,
    grade: r.grade,
    section: r.section,
    date: r.date,
    academicYear: r.academic_year,
    records: recs.map(rec => ({
      _id: rec.id,
      studentId: rec.student_id,
      status: rec.status,
      remarks: rec.remarks
    })),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

export async function findOne(where) {
  const colMap = { facultyId: 'faculty_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(
    `SELECT * FROM attendance_logs WHERE ${conds} LIMIT 1`, Object.values(where)
  );
  return rows[0] ? row2log(rows[0]) : null;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2log(rows[0]) : null;
}

export async function find(where = {}) {
  const colMap = { facultyId: 'faculty_id', grade: 'grade', section: 'section', academicYear: 'academic_year' };
  let sql = 'SELECT * FROM attendance_logs';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2log));
}

export async function create(data) {
  const { facultyId, grade, section, date, academicYear, records = [] } = data;
  const [result] = await pool.query(
    'INSERT INTO attendance_logs (faculty_id, grade, section, date, academic_year) VALUES (?, ?, ?, ?, ?)',
    [facultyId, grade, section, date, academicYear || null]
  );
  const logId = result.insertId;
  await _setRecords(logId, records);
  return findById(logId);
}

export async function save(obj) {
  await pool.query(
    'UPDATE attendance_logs SET grade=?, section=?, academic_year=? WHERE id=?',
    [obj.grade, obj.section, obj.academicYear || null, obj._id]
  );
  await _setRecords(obj._id, obj.records || []);
  return findById(obj._id);
}

async function _setRecords(logId, records) {
  await pool.query('DELETE FROM attendance_records WHERE log_id = ?', [logId]);
  if (!records.length) return;
  const rows = records.map(r => [logId, r.studentId, r.status || 'Present', r.remarks || '']);
  await pool.query(
    'INSERT INTO attendance_records (log_id, student_id, status, remarks) VALUES ?', [rows]
  );
}

export default { findOne, findById, find, create, save };
