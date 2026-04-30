import pool from '../db/pool.js';

try {
  // Increase packet size for the session
  await pool.query('SET GLOBAL max_allowed_packet = 67108864');
  console.log('max_allowed_packet set to 64MB');
} catch (e) {
  console.warn('Could not set max_allowed_packet (may need root):', e.message);
}

// Create homework_submissions table
await pool.query(`
  CREATE TABLE IF NOT EXISTS homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    pdf_data LONGBLOB DEFAULT NULL,
    pdf_filename VARCHAR(255) DEFAULT NULL,
    pdf_size INT DEFAULT NULL,
    uploaded_at DATETIME DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    score DECIMAL(5,2) DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    graded_by INT DEFAULT NULL,
    graded_at DATETIME DEFAULT NULL,
    status ENUM('pending','submitted','graded') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_hw_student (homework_id, student_id),
    INDEX idx_homework_id (homework_id),
    INDEX idx_student_id (student_id),
    INDEX idx_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);
console.log('homework_submissions table ready');

// Add submission_deadline to homework table
try {
  await pool.query('ALTER TABLE homework ADD COLUMN submission_deadline DATETIME DEFAULT NULL');
  console.log('submission_deadline column added to homework');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('submission_deadline column already exists');
  } else {
    throw e;
  }
}

console.log('Setup complete!');
process.exit(0);
