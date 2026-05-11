import pool from '../db/pool.js';

async function updateAdmin() {
  try {
    // We update the administrator user to have srv_number = 'ADMIN' and password hash for 'admin123'
    const adminSrvNumber = 'ADMIN';
    const adminPasswordHash = '$2b$10$wkmy56vruB2rDmLnilbaGuhRy.p9jemqgiIKPHM9Uoj632jvvMLj2'; // bcrypt hash for 'admin123'

    const [result] = await pool.query(
      `UPDATE users 
       SET srv_number = ?, password = ?, name = 'Administrator' 
       WHERE role = 'admin' OR srv_number = 'ADMIN001' LIMIT 1`,
      [adminSrvNumber, adminPasswordHash]
    );

    if (result.affectedRows > 0) {
      console.log("SUCCESS: Admin credentials updated in MySQL successfully!");
    } else {
      console.log("WARNING: No existing admin found to update. Creating a new one...");
      await pool.query(
        `INSERT INTO users (name, srv_number, password, role) 
         VALUES ('Administrator', ?, ?, 'admin')`,
        [adminSrvNumber, adminPasswordHash]
      );
      console.log("SUCCESS: New admin user created successfully!");
    }
  } catch (err) {
    console.error("Failed to update database:", err.message);
  }
  process.exit();
}

updateAdmin();
