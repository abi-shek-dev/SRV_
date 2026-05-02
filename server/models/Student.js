import pool from '../db/pool.js';

const row2student = (r) => {
  if (!r) return null;
  return {
    _id: r.id, id: r.id,
    name: r.name,
    srvNumber: r.srv_number,
    grade: r.grade,
    section: r.section,
    motherName: r.mother_name,
    fatherName: r.father_name,
    guardianName: r.guardian_name,
    parentMobileNumber: r.parent_mobile_number,
    dateOfBirth: r.date_of_birth,
    contactNumber: r.contact_number,
    address: r.address,
    group: r.group,
    facultyId: r.faculty_id,
    fees: {
      term1: r.fee_term1, term1Amount: Number(r.fee_term1_amount), term1Paid: Number(r.fee_term1_paid),
      term2: r.fee_term2, term2Amount: Number(r.fee_term2_amount), term2Paid: Number(r.fee_term2_paid),
      term3: r.fee_term3, term3Amount: Number(r.fee_term3_amount), term3Paid: Number(r.fee_term3_paid),
      overall: r.fee_overall,
      additionalFees: Number(r.fee_additional), additionalPaid: Number(r.fee_additional_paid)
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

export async function findOne(where) {
  const colMap = { _id: 'id', facultyId: 'faculty_id', srvNumber: 'srv_number' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM students WHERE ${conds} LIMIT 1`, Object.values(where));
  return row2student(rows[0]);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ? LIMIT 1', [id]);
  return row2student(rows[0]);
}

export async function find(where = {}, opts = {}) {
  const colMap = { facultyId: 'faculty_id', grade: 'grade', section: 'section', srvNumber: 'srv_number' };
  let sql = 'SELECT * FROM students';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  if (opts.sort) sql += ` ORDER BY ${opts.sort}`;
  const [rows] = await pool.query(sql, vals);
  return rows.map(row2student);
}

export async function findOneByField(field, value) {
  const [rows] = await pool.query(`SELECT * FROM students WHERE \`${field}\` = ? LIMIT 1`, [value]);
  return row2student(rows[0]);
}

export async function countDocuments(where = {}) {
  const colMap = { facultyId: 'faculty_id' };
  const keys = Object.keys(where);
  let sql = 'SELECT COUNT(*) AS cnt FROM students';
  const vals = [];
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  const [rows] = await pool.query(sql, vals);
  return rows[0].cnt;
}

export async function create(data) {
  const {
    name, srvNumber, grade, section, group, motherName, fatherName, guardianName,
    parentMobileNumber, dateOfBirth, contactNumber, address, facultyId
  } = data;

  const [result] = await pool.query(
    `INSERT INTO students
     (name, srv_number, grade, section, \`group\`, mother_name, father_name, guardian_name,
      parent_mobile_number, date_of_birth, contact_number, address, faculty_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, srvNumber, grade, section, group || null, motherName || '', fatherName || '',
     guardianName || '', parentMobileNumber || '', dateOfBirth || null,
     contactNumber || null, address || null, facultyId || null]
  );
  return findById(result.insertId);
}

export async function updateById(id, data) {
  const colMap = {
    name: 'name', srvNumber: 'srv_number', grade: 'grade', section: 'section', group: 'group',
    motherName: 'mother_name', fatherName: 'father_name', guardianName: 'guardian_name',
    parentMobileNumber: 'parent_mobile_number', dateOfBirth: 'date_of_birth',
    contactNumber: 'contact_number', address: 'address', facultyId: 'faculty_id',
    'fees.term1': 'fee_term1', 'fees.term1Amount': 'fee_term1_amount', 'fees.term1Paid': 'fee_term1_paid',
    'fees.term2': 'fee_term2', 'fees.term2Amount': 'fee_term2_amount', 'fees.term2Paid': 'fee_term2_paid',
    'fees.term3': 'fee_term3', 'fees.term3Amount': 'fee_term3_amount', 'fees.term3Paid': 'fee_term3_paid',
    'fees.overall': 'fee_overall', 'fees.additionalFees': 'fee_additional', 'fees.additionalPaid': 'fee_additional_paid'
  };
  const fields = {};
  for (const [k, col] of Object.entries(colMap)) {
    if (data[k] !== undefined) fields[col] = data[k];
  }
  // Also handle nested fees object
  if (data.fees) {
    const f = data.fees;
    const feeMap = { term1: 'fee_term1', term1Amount: 'fee_term1_amount', term1Paid: 'fee_term1_paid',
      term2: 'fee_term2', term2Amount: 'fee_term2_amount', term2Paid: 'fee_term2_paid',
      term3: 'fee_term3', term3Amount: 'fee_term3_amount', term3Paid: 'fee_term3_paid',
      overall: 'fee_overall', additionalFees: 'fee_additional', additionalPaid: 'fee_additional_paid' };
    for (const [k, col] of Object.entries(feeMap)) {
      if (f[k] !== undefined) fields[col] = f[k];
    }
  }
  if (!Object.keys(fields).length) return findById(id);
  const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
  await pool.query(`UPDATE students SET ${setClauses} WHERE id = ?`, [...Object.values(fields), id]);
  return findById(id);
}

export async function save(obj) { return updateById(obj._id, obj); }

export async function findByIdAndDelete(id) {
  const s = await findById(id);
  if (s) await pool.query('DELETE FROM students WHERE id = ?', [id]);
  return s;
}

export async function updateMany(where, update) {
  // where: { facultyId: x } or { grade: x }
  // update: { $set: { facultyId: null } } or { $set: { grade: y } }
  const colMap = { _id: 'id', facultyId: 'faculty_id', grade: 'grade', section: 'section' };
  const setData = update['$set'] || update;
  const fields = {};
  for (const [k, v] of Object.entries(setData)) { fields[colMap[k] || k] = v; }
  if (!Object.keys(fields).length) return;
  const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
  const whereKeys = Object.keys(where);
  const vals = [...Object.values(fields)];
  let sql = `UPDATE students SET ${setClauses}`;
  if (whereKeys.length) {
    // handle $in operator
    const conds = whereKeys.map(k => {
      const col = colMap[k] || k;
      const val = where[k];
      if (val && val['$in']) {
        vals.push(...val['$in']);
        return `\`${col}\` IN (${val['$in'].map(() => '?').join(',')})`;
      }
      vals.push(val);
      return `\`${col}\` = ?`;
    });
    sql += ' WHERE ' + conds.join(' AND ');
  }
  const [result] = await pool.query(sql, vals);
  return { modifiedCount: result.affectedRows };
}

// Find all students with their faculty name joined (replaces .populate('facultyId'))
export async function findWithFaculty() {
  const [rows] = await pool.query(
    `SELECT s.*, u.name AS faculty_name, u.srv_number AS faculty_srv
     FROM students s
     LEFT JOIN users u ON u.id = s.faculty_id
     ORDER BY CAST(REGEXP_REPLACE(s.srv_number, '[^0-9]', '') AS UNSIGNED) ASC`
  );
  return rows.map(r => ({
    ...row2student(r),
    facultyId: r.faculty_id ? { _id: r.faculty_id, name: r.faculty_name, srvNumber: r.faculty_srv } : null
  }));
}

// Find the last student whose srvNumber starts with prefix (for auto-increment)
export async function findLastBySrvPrefix(prefix) {
  const [rows] = await pool.query(
    'SELECT * FROM students WHERE srv_number LIKE ? ORDER BY srv_number DESC LIMIT 1',
    [`${prefix}%`]
  );
  return row2student(rows[0]);
}

export async function syncFacultyMappings() {
  // 1. Assign correct faculty ID where grade and section match
  const sqlAssign = `
    UPDATE students s
    JOIN users u ON u.role = 'faculty' AND u.assigned_grade = s.grade AND u.assigned_section = s.section
    SET s.faculty_id = u.id
  `;
  await pool.query(sqlAssign);

  // 2. Clear faculty ID if the assigned faculty no longer matches (or no faculty exists)
  const sqlClear = `
    UPDATE students s
    LEFT JOIN users u ON u.role = 'faculty' AND u.assigned_grade = s.grade AND u.assigned_section = s.section
    SET s.faculty_id = NULL
    WHERE u.id IS NULL AND s.faculty_id IS NOT NULL
  `;
  await pool.query(sqlClear);
}

export default {
  findOne, findById, find, findOneByField, countDocuments,
  create, updateById, save, findByIdAndDelete, updateMany,
  findWithFaculty, findLastBySrvPrefix,
  syncFacultyMappings
};
