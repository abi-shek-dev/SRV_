import pool from '../db/pool.js';

const row2enq = async (r) => {
  if (!r) return null;
  const [ints] = await pool.query(
    'SELECT * FROM enquiry_interactions WHERE enquiry_id = ? ORDER BY created_at ASC', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    studentName: r.student_name, parentName: r.parent_name, parentMobile: r.parent_mobile,
    email: r.email, grade: r.grade, section: r.section,
    dateOfBirth: r.date_of_birth, address: r.address,
    motherName: r.mother_name, fatherName: r.father_name, guardianName: r.guardian_name,
    source: r.source, programInterest: r.program_interest, remarks: r.remarks,
    referredBy: r.referred_by, status: r.status,
    leadScore: r.lead_score, leadTemperature: r.lead_temperature,
    interactions: ints.map(i => ({
      _id: i.id, type: i.type, notes: i.notes, by: i.by_user_id,
      createdAt: i.created_at, updatedAt: i.updated_at
    })),
    lastFollowUp: r.last_follow_up, nextFollowUp: r.next_follow_up, followUpCount: r.follow_up_count,
    convertedStudentId: r.converted_student_id, convertedAt: r.converted_at,
    createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  const colMap = { status: 'status', createdBy: 'created_by' };
  let sql = 'SELECT * FROM enquiries';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || k;
    if (v && v['$ne'] !== undefined) { conds.push(`\`${col}\` != ?`); vals.push(v['$ne']); }
    else { conds.push(`\`${col}\` = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2enq));
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2enq(rows[0]) : null;
}

export async function create(data) {
  const {
    studentName, parentName = '', parentMobile = '', email = '', grade = '', section = '',
    dateOfBirth, address = '', motherName = '', fatherName = '', guardianName = '',
    source = 'Walk-in', programInterest = 'General', remarks = '',
    referredBy, status = 'New', leadScore = 0, leadTemperature = 'Cold', createdBy
  } = data;
  const [result] = await pool.query(
    `INSERT INTO enquiries
     (student_name, parent_name, parent_mobile, email, grade, section, date_of_birth, address,
      mother_name, father_name, guardian_name, source, program_interest, remarks,
      referred_by, status, lead_score, lead_temperature, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentName, parentName, parentMobile, email, grade, section, dateOfBirth || null, address,
     motherName, fatherName, guardianName, source, programInterest, remarks,
     referredBy || null, status, leadScore, leadTemperature, createdBy || null]
  );
  return findById(result.insertId);
}

export async function save(obj) {
  await pool.query(
    `UPDATE enquiries SET student_name=?, parent_name=?, parent_mobile=?, email=?, grade=?, section=?,
      date_of_birth=?, address=?, mother_name=?, father_name=?, guardian_name=?,
      source=?, program_interest=?, remarks=?, referred_by=?, status=?,
      lead_score=?, lead_temperature=?, last_follow_up=?, next_follow_up=?,
      follow_up_count=?, converted_student_id=?, converted_at=?
     WHERE id=?`,
    [obj.studentName, obj.parentName, obj.parentMobile, obj.email, obj.grade, obj.section,
     obj.dateOfBirth || null, obj.address, obj.motherName, obj.fatherName, obj.guardianName,
     obj.source, obj.programInterest, obj.remarks, obj.referredBy || null, obj.status,
     obj.leadScore, obj.leadTemperature, obj.lastFollowUp || null, obj.nextFollowUp || null,
     obj.followUpCount, obj.convertedStudentId || null, obj.convertedAt || null, obj._id]
  );
  return findById(obj._id);
}

export async function addInteraction(enquiryId, interaction) {
  await pool.query(
    'INSERT INTO enquiry_interactions (enquiry_id, type, notes, by_user_id) VALUES (?, ?, ?, ?)',
    [enquiryId, interaction.type, interaction.notes || '', interaction.by || null]
  );
  return findById(enquiryId);
}

export async function findByIdAndDelete(id) {
  const enq = await findById(id);
  if (enq) await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);
  return enq;
}

export async function countDocuments(where = {}) {
  const colMap = { status: 'status' };
  let sql = 'SELECT COUNT(*) AS cnt FROM enquiries';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || k;
    if (v && v['$ne'] !== undefined) { conds.push(`\`${col}\` != ?`); vals.push(v['$ne']); }
    else { conds.push(`\`${col}\` = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  const [rows] = await pool.query(sql, vals);
  return rows[0].cnt;
}

// Search by name/mobile across fields (replaces $regex $or)
export async function findWithSearch(filters = {}) {
  const { status, source, programInterest, search } = filters;
  let sql = 'SELECT * FROM enquiries WHERE 1=1';
  const vals = [];
  if (status) { sql += ' AND status = ?'; vals.push(status); }
  if (source) { sql += ' AND source = ?'; vals.push(source); }
  if (programInterest) { sql += ' AND program_interest = ?'; vals.push(programInterest); }
  if (search) {
    sql += ' AND (student_name LIKE ? OR parent_name LIKE ? OR parent_mobile LIKE ?)';
    const like = `%${search}%`;
    vals.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2enq));
}

// Stale: no follow-up in 48+ hours, status New/Contacted
export async function findStale(hoursAgo) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const [rows] = await pool.query(
    `SELECT * FROM enquiries
     WHERE status IN ('New','Contacted')
       AND (last_follow_up < ? OR (last_follow_up IS NULL AND created_at < ?))
     ORDER BY created_at ASC`,
    [cutoff, cutoff]
  );
  return Promise.all(rows.map(row2enq));
}

// Hot leads: New, score >= 50, no interactions
export async function findHotUncontacted(minScore) {
  const [rows] = await pool.query(
    `SELECT e.* FROM enquiries e
     LEFT JOIN enquiry_interactions ei ON ei.enquiry_id = e.id
     WHERE e.status = 'New' AND e.lead_score >= ? AND ei.id IS NULL
     ORDER BY e.lead_score DESC`,
    [minScore]
  );
  return Promise.all(rows.map(row2enq));
}

// Aging: active enquiries older than N days
export async function findAging(daysAgo, statuses = ['New','Contacted','Interested']) {
  const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const placeholders = statuses.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT * FROM enquiries WHERE status IN (${placeholders}) AND created_at < ? ORDER BY created_at ASC`,
    [...statuses, cutoff]
  );
  return Promise.all(rows.map(row2enq));
}

// Aggregate stats for analytics
export async function getStats() {
  const [countRows] = await pool.query(
    `SELECT status, COUNT(*) AS cnt FROM enquiries GROUP BY status`
  );
  const [programRows] = await pool.query(
    `SELECT program_interest AS _id, COUNT(*) AS count FROM enquiries GROUP BY program_interest`
  );
  const [sourceRows] = await pool.query(
    `SELECT source AS _id, COUNT(*) AS count FROM enquiries GROUP BY source`
  );
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [monthlyRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS _id,
            COUNT(*) AS total,
            SUM(CASE WHEN status='Converted' THEN 1 ELSE 0 END) AS converted
     FROM enquiries WHERE created_at >= ?
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY _id ASC`,
    [sixMonthsAgo]
  );
  const [tempRows] = await pool.query(
    `SELECT lead_temperature AS _id, COUNT(*) AS count FROM enquiries
     WHERE status NOT IN ('Converted','Not Interested') GROUP BY lead_temperature`
  );
  return {
    countRows,
    programBreakdown: programRows,
    sourceBreakdown: sourceRows,
    monthlyTrends: monthlyRows,
    temperatureBreakdown: tempRows
  };
}

export default { find, findById, findWithSearch, findStale, findHotUncontacted, findAging,
  create, save, addInteraction, findByIdAndDelete, countDocuments, getStats };
