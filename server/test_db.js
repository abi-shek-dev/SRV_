import pool from './db/pool.js';
async function run() {
  try {
    const [rows] = await pool.query('DESCRIBE homework');
    console.log(rows);
  } catch (err) {
    console.error(err.message);
  }
  process.exit();
}
run();
