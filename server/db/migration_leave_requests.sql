-- Leave Requests table for Phase 3
CREATE TABLE IF NOT EXISTS leave_requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id    INT UNSIGNED NOT NULL,
  parent_id     INT UNSIGNED NOT NULL,
  leave_type    ENUM('SICK','PERSONAL','FAMILY','OTHER') DEFAULT 'OTHER',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT DEFAULT '',
  status        ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by   INT UNSIGNED DEFAULT NULL,
  review_note   TEXT DEFAULT '',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);
