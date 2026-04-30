import pool from './db/pool.js';

async function run() {
  try {
    console.log("Altering memories table...");
    await pool.query("ALTER TABLE memories MODIFY created_by_role ENUM('admin', 'faculty') DEFAULT 'admin'");
    console.log("Added faculty to created_by_role");
    
    // Check if student_id exists first
    const [rows] = await pool.query("SHOW COLUMNS FROM memories LIKE 'student_id'");
    if (rows.length === 0) {
      await pool.query("ALTER TABLE memories ADD COLUMN student_id INT UNSIGNED DEFAULT NULL");
      await pool.query("ALTER TABLE memories ADD CONSTRAINT fk_student_id FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE");
      console.log("Added student_id column and foreign key");
    } else {
      console.log("student_id column already exists");
    }
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
