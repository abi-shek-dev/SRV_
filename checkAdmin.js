import pool from './server/db/pool.js';
import bcrypt from 'bcryptjs';

async function checkAdmin() {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    console.log("Admin users found:", rows.length);
    
    for (const row of rows) {
      console.log(`- ID: ${row.id}, SRV: ${row.srv_number}, Name: ${row.name}`);
      const isMatch = await bcrypt.compare('admin123', row.password);
      console.log(`  Password 'admin123' matches? ${isMatch}`);
    }
    
    if (rows.length === 0) {
      console.log("No admin found. Creating one...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      await pool.query(
        "INSERT INTO users (name, srv_number, password, role) VALUES (?, ?, ?, ?)",
        ['System Admin', 'ADMIN001', hash, 'admin']
      );
      console.log("Created ADMIN001 / admin123");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAdmin();
