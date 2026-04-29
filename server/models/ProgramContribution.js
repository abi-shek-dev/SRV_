import pool from '../db/pool.js';

const r2pc = (r) => !r ? null : {
  _id: r.id, id: r.id,
  facultyId: r.faculty_id, programName: r.program_name,
  hoursContributed: Number(r.hours_contributed),
  participationLevel: r.participation_level, month: r.month,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}) {
  const colMap = { facultyId: 'faculty_id', month: 'month', programName: 'program_name' };
  let sql = 'SELECT * FROM program_contributions';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) { conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  const [rows] = await pool.query(sql, vals);
  return rows.map(r2pc);
}

export async function create(data) {
  const { facultyId, programName, hoursContributed = 0, participationLevel = 'Active', month } = data;
  const [result] = await pool.query(
    `INSERT INTO program_contributions (faculty_id, program_name, hours_contributed, participation_level, month)
     VALUES (?, ?, ?, ?, ?)`,
    [facultyId, programName, hoursContributed, participationLevel, month || null]
  );
  const [rows] = await pool.query('SELECT * FROM program_contributions WHERE id = ?', [result.insertId]);
  return r2pc(rows[0]);
}

export async function save(obj) {
  await pool.query(
    'UPDATE program_contributions SET hours_contributed=?, participation_level=? WHERE id=?',
    [obj.hoursContributed, obj.participationLevel, obj._id]
  );
  return obj;
}

export default { find, create, save };
