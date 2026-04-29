import pool from '../db/pool.js';

const r2n = (r) => !r ? null : {
  _id: r.id, id: r.id, userId: r.user_id, type: r.type,
  message: r.message, isRead: Boolean(r.is_read),
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}, opts = {}) {
  const colMap = { userId: 'user_id', type: 'type', isRead: 'is_read' };
  let sql = 'SELECT * FROM notifications';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ` ORDER BY created_at DESC${opts.limit ? ` LIMIT ${opts.limit}` : ''}`;
  const [rows] = await pool.query(sql, vals);
  return rows.map(r2n);
}

export async function create(data) {
  const { userId, type, message } = data;
  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [userId, type, message]
  );
  return { _id: result.insertId, userId, type, message, isRead: false };
}

export async function insertMany(records) {
  if (!records.length) return;
  const rows = records.map(r => [r.userId, r.type, r.message]);
  await pool.query('INSERT INTO notifications (user_id, type, message) VALUES ?', [rows]);
}

export async function updateMany(where, update) {
  const colMap = { userId: 'user_id', isRead: 'is_read', _id: 'id' };
  const setData = update['$set'] || update;
  const fields = {};
  for (const [k, v] of Object.entries(setData)) { fields[colMap[k] || k] = v; }
  const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
  const vals = [...Object.values(fields)];
  let sql = `UPDATE notifications SET ${setClauses}`;
  const conds = Object.keys(where).map(k => { vals.push(where[k]); return `\`${colMap[k] || k}\` = ?`; });
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  await pool.query(sql, vals);
}


export default { find, create, insertMany, updateMany };
