import pool from '../db/pool.js';

const r2fm = (r) => !r ? null : {
  _id: r.id, id: r.id, day: r.day,
  breakfast: r.breakfast, lunch: r.lunch, snacks: r.snacks,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find() {
  const [rows] = await pool.query('SELECT * FROM food_menu ORDER BY FIELD(day, "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")');
  return rows.map(r2fm);
}

export async function findOne(where) {
  const [rows] = await pool.query('SELECT * FROM food_menu WHERE day = ? LIMIT 1', [where.day]);
  return r2fm(rows[0]);
}

export async function create(data) {
  const { day, breakfast = '', lunch = '', snacks = '' } = data;
  const [result] = await pool.query(
    'INSERT INTO food_menu (day, breakfast, lunch, snacks) VALUES (?, ?, ?, ?)',
    [day, breakfast, lunch, snacks]
  );
  const [rows] = await pool.query('SELECT * FROM food_menu WHERE id = ?', [result.insertId]);
  return r2fm(rows[0]);
}

export async function save(obj) {
  await pool.query(
    'UPDATE food_menu SET breakfast=?, lunch=?, snacks=? WHERE id=?',
    [obj.breakfast, obj.lunch, obj.snacks, obj._id]
  );
  const [rows] = await pool.query('SELECT * FROM food_menu WHERE id = ?', [obj._id]);
  return r2fm(rows[0]);
}

// Case-insensitive trimmed day name lookup (replaces $regex)
export async function findDayByName(dayName) {
  const [rows] = await pool.query(
    'SELECT * FROM food_menu WHERE TRIM(LOWER(day)) = LOWER(?) LIMIT 1', [dayName]
  );
  return r2fm(rows[0]);
}

export default { find, findOne, findDayByName, create, save };
