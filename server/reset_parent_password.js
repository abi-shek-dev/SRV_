import pool from './db/pool.js';
import bcrypt from 'bcryptjs';

// Reset the parent account password for SRV26001 to DOB: 06022006 (ddmmyyyy)
async function run() {
  try {
    const srvNumber = 'SRV26001';
    const newPassword = '06022006';

    const [users] = await pool.query(
      "SELECT * FROM users WHERE srv_number = ? AND role = 'parent' LIMIT 1",
      [srvNumber]
    );

    if (users.length === 0) {
      console.log(`No parent account found for ${srvNumber}`);
      process.exit(0);
    }

    const user = users[0];
    console.log(`Found parent account: ID=${user.id}, Name=${user.name}`);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
    console.log(`Password reset to "${newPassword}" for ${srvNumber}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
