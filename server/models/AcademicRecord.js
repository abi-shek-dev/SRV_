import pool from '../db/pool.js';

const row2record = async (r) => {
  if (!r) return null;
  const [acts] = await pool.query(
    'SELECT activity FROM academic_record_activities WHERE record_id = ?', [r.id]
  );
  const attendancePercentage = r.total_working_days > 0
    ? ((r.days_present / r.total_working_days) * 100).toFixed(2)
    : '0.00';
  return {
    _id: r.id, id: r.id,
    studentId: r.student_id,
    facultyId: r.faculty_id,
    term: r.term,
    marks: {
      english: Number(r.mark_english || 0),
      tamil: Number(r.mark_tamil || 0),
      hindi: Number(r.mark_hindi || 0),
      math: Number(r.mark_math || 0),
      science: Number(r.mark_science || 0),
      socialScience: Number(r.mark_social_science || 0),
      computerScience: Number(r.mark_computer_science || 0)
    },
    totalWorkingDays: r.total_working_days,
    daysPresent: r.days_present,
    attendancePercentage,
    performanceRemarks: r.performance_remarks,
    behaviour: r.behaviour,
    extraActivities: acts.map(a => a.activity),
    ecSkills: { cdc: r.ec_cdc, suits: r.ec_suits, srvSkillDevelopment: r.ec_srv_skill_dev },
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

const normalizeMarks = (marks = {}) => {
  const result = {
    english: 0, tamil: 0, hindi: 0, math: 0, science: 0, socialScience: 0, computerScience: 0
  };
  
  for (const [key, value] of Object.entries(marks)) {
    const k = key.toLowerCase().replace(/\s+/g, '');
    if (k === 'english') result.english = Number(value);
    else if (k === 'tamil') result.tamil = Number(value);
    else if (k === 'hindi') result.hindi = Number(value);
    else if (k === 'math' || k === 'mathematics') result.math = Number(value);
    else if (k === 'science') result.science = Number(value);
    else if (k === 'socialscience') result.socialScience = Number(value);
    else if (k === 'computerscience') result.computerScience = Number(value);
    else if (k === 'language') result.tamil = Number(value); // Fallback
  }
  return result;
};

export async function findOne(where) {
  const colMap = { studentId: 'student_id', facultyId: 'faculty_id', term: 'term' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM academic_records WHERE ${conds} LIMIT 1`, Object.values(where));
  return rows[0] ? row2record(rows[0]) : null;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM academic_records WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2record(rows[0]) : null;
}

export async function find(where = {}, opts = {}) {
  const colMap = { studentId: 'student_id', facultyId: 'faculty_id' };
  let sql = 'SELECT * FROM academic_records';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  if (opts.sort) sql += ` ORDER BY ${opts.sort}`;
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2record));
}

export async function create(data) {
  const { studentId, facultyId, term, marks = {}, totalWorkingDays = 0, daysPresent = 0,
    performanceRemarks, behaviour = 'Good', extraActivities = [], ecSkills = {} } = data;

  const nMarks = normalizeMarks(marks);

  const [result] = await pool.query(
    `INSERT INTO academic_records
     (student_id, faculty_id, term, mark_english, mark_tamil, mark_hindi, mark_math,
      mark_science, mark_social_science, mark_computer_science, total_working_days, days_present,
      performance_remarks, behaviour, ec_cdc, ec_suits, ec_srv_skill_dev)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentId, facultyId, term,
     nMarks.english, nMarks.tamil, nMarks.hindi, nMarks.math,
     nMarks.science, nMarks.socialScience, nMarks.computerScience,
     totalWorkingDays, daysPresent, performanceRemarks || null, behaviour,
     ecSkills?.cdc ?? 0, ecSkills?.suits ?? 0, ecSkills?.srvSkillDevelopment ?? 0]
  );
  const newId = result.insertId;
  if (extraActivities.length) await _setActivities(newId, extraActivities);
  return findById(newId);
}

export async function save(obj) {
  const { _id, marks = {}, ecSkills = {}, extraActivities = [] } = obj;
  const nMarks = normalizeMarks(marks);

  await pool.query(
    `UPDATE academic_records SET
      mark_english=?, mark_tamil=?, mark_hindi=?, mark_math=?, mark_science=?, mark_social_science=?, mark_computer_science=?,
      total_working_days=?, days_present=?, performance_remarks=?, behaviour=?,
      ec_cdc=?, ec_suits=?, ec_srv_skill_dev=?
     WHERE id=?`,
    [nMarks.english, nMarks.tamil, nMarks.hindi, nMarks.math,
     nMarks.science, nMarks.socialScience, nMarks.computerScience,
     obj.totalWorkingDays ?? 0, obj.daysPresent ?? 0,
     obj.performanceRemarks || null, obj.behaviour || 'Good',
     ecSkills?.cdc ?? 0, ecSkills?.suits ?? 0, ecSkills?.srvSkillDevelopment ?? 0, _id]
  );
  await _setActivities(_id, extraActivities);
  return findById(_id);
}

async function _setActivities(recordId, activities) {
  await pool.query('DELETE FROM academic_record_activities WHERE record_id = ?', [recordId]);
  if (!activities.length) return;
  const rows = activities.map(a => [recordId, a]);
  await pool.query('INSERT INTO academic_record_activities (record_id, activity) VALUES ?', [rows]);
}

export default { findOne, findById, find, create, save };
