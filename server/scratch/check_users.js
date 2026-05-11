import pool from '../db/pool.js';

async function check() {
  try {
    const [users] = await pool.query("SELECT id, name, srv_number, role, password FROM users");
    console.log("--- USERS IN DATABASE ---");
    if (users.length === 0) {
      console.log("The users table is completely empty!");
    } else {
      console.table(users);
    }
  } catch (err) {
    console.error("Database query failed:", err.message);
  }
  process.exit();
}

check();
