import pool from '../db/pool.js';

const r2pr = (r) => !r ? null : {
  _id: r.id, id: r.id, srvNumber: r.srv_number, role: r.role,
  status: r.status, newPassword: r.new_password,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}, opts = {}) {
  const colMap = { srvNumber: 'srv_number', status: 'status' };
  let sql = 'SELECT * FROM password_resets';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return rows.map(r2pr);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM password_resets WHERE id = ? LIMIT 1', [id]);
  return r2pr(rows[0]);
}

export async function create(data) {
  const { srvNumber, role, status = 'Pending', newPassword = '' } = data;
  const [result] = await pool.query(
    'INSERT INTO password_resets (srv_number, role, status, new_password) VALUES (?, ?, ?, ?)',
    [srvNumber, role, status, newPassword]
  );
  return findById(result.insertId);
}

export async function save(obj) {
  await pool.query(
    'UPDATE password_resets SET status=?, new_password=? WHERE id=?',
    [obj.status, obj.newPassword || '', obj._id]
  );
  return findById(obj._id);
}

export async function deleteMany(where) {
  const colMap = { srvNumber: 'srv_number' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  await pool.query(`DELETE FROM password_resets WHERE ${conds}`, Object.values(where));
}

export default { find, findById, create, save, deleteMany };
