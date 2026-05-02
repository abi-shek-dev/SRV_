import pool from './db/pool.js';
async function test() {
  try {
    const [rows] = await pool.query("SHOW TRIGGERS");
    console.log(rows);
  } catch(e) { console.error(e) }
  process.exit();
}
test();
