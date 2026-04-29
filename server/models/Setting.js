import pool from '../db/pool.js';

export async function findOne(where) {
  const [rows] = await pool.query('SELECT * FROM settings WHERE `key` = ? LIMIT 1', [where.key]);
  if (!rows[0]) return null;
  let value;
  try { value = JSON.parse(rows[0].value); } catch { value = rows[0].value; }
  return { _id: rows[0].id, id: rows[0].id, key: rows[0].key, value };
}

export async function create(data) {
  const { key, value } = data;
  const stored = JSON.stringify(value);
  const [result] = await pool.query(
    'INSERT INTO settings (`key`, value) VALUES (?, ?)', [key, stored]
  );
  return { _id: result.insertId, key, value };
}

export async function save(obj) {
  const stored = JSON.stringify(obj.value);
  await pool.query('UPDATE settings SET value=? WHERE id=?', [stored, obj._id]);
  return obj;
}

export default { findOne, create, save };
