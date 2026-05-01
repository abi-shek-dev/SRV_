-- ============================================================
-- SRV School Management System — MySQL Schema
-- CWP / MySQL 8.x compatible
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ──────────────────────────────────────────────────────────
-- USERS (admin, faculty, parent)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  srv_number          VARCHAR(50)  NOT NULL UNIQUE,
  password            VARCHAR(255) NOT NULL,
  recovery_question   VARCHAR(500) DEFAULT '',
  recovery_answer_hash VARCHAR(255) DEFAULT '',
  role                ENUM('admin','faculty','parent') NOT NULL,
  -- Faculty fields
  assigned_grade      VARCHAR(20)  DEFAULT NULL,
  assigned_section    VARCHAR(20)  DEFAULT NULL,
  mobile_number       VARCHAR(20)  DEFAULT NULL,
  max_students        INT          DEFAULT 30,
  -- Parent field
  student_id          INT UNSIGNED DEFAULT NULL,
  expo_push_token     VARCHAR(255) DEFAULT NULL,
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_student_id (student_id)
);

-- Faculty handled classes (User.handledClasses array)
CREATE TABLE IF NOT EXISTS faculty_handled_classes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  grade       VARCHAR(20) DEFAULT NULL,
  section     VARCHAR(20) DEFAULT NULL,
  subject     VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ──────────────────────────────────────────────────────────
-- STUDENTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  srv_number          VARCHAR(50)  NOT NULL UNIQUE,
  grade               VARCHAR(20)  NOT NULL,
  section             VARCHAR(20)  NOT NULL,
  mother_name         VARCHAR(255) DEFAULT '',
  father_name         VARCHAR(255) DEFAULT '',
  guardian_name       VARCHAR(255) DEFAULT '',
  parent_mobile_number VARCHAR(20) DEFAULT '',
  date_of_birth       DATE         DEFAULT NULL,
  contact_number      VARCHAR(20)  DEFAULT NULL,
  address             TEXT         DEFAULT NULL,
  `group`             VARCHAR(100) DEFAULT NULL,
  faculty_id          INT UNSIGNED DEFAULT NULL,
  -- Fees embedded
  fee_term1           ENUM('Paid','Partial','Unpaid') DEFAULT 'Unpaid',
  fee_term1_amount    DECIMAL(10,2) DEFAULT 4500,
  fee_term1_paid      DECIMAL(10,2) DEFAULT 0,
  fee_term2           ENUM('Paid','Partial','Unpaid') DEFAULT 'Unpaid',
  fee_term2_amount    DECIMAL(10,2) DEFAULT 4500,
  fee_term2_paid      DECIMAL(10,2) DEFAULT 0,
  fee_term3           ENUM('Paid','Partial','Unpaid') DEFAULT 'Unpaid',
  fee_term3_amount    DECIMAL(10,2) DEFAULT 4500,
  fee_term3_paid      DECIMAL(10,2) DEFAULT 0,
  fee_overall         ENUM('Paid','Partial','Unpaid') DEFAULT 'Unpaid',
  fee_additional      DECIMAL(10,2) DEFAULT 0,
  fee_additional_paid DECIMAL(10,2) DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grade_section (grade, section),
  INDEX idx_faculty_id (faculty_id)
);

-- ──────────────────────────────────────────────────────────
-- ACADEMIC RECORDS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_records (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id          INT UNSIGNED NOT NULL,
  faculty_id          INT UNSIGNED NOT NULL,
  term                VARCHAR(100) NOT NULL,
  mark_english        DECIMAL(5,2) DEFAULT 0,
  mark_tamil          DECIMAL(5,2) DEFAULT 0,
  mark_hindi          DECIMAL(5,2) DEFAULT 0,
  mark_math           DECIMAL(5,2) DEFAULT 0,
  mark_science        DECIMAL(5,2) DEFAULT 0,
  mark_social_science DECIMAL(5,2) DEFAULT 0,
  total_working_days  INT DEFAULT 0,
  days_present        INT DEFAULT 0,
  performance_remarks TEXT DEFAULT NULL,
  behaviour           ENUM('Excellent','Good','Needs Improvement','Poor') DEFAULT 'Good',
  ec_cdc              TINYINT DEFAULT 0,
  ec_suits            TINYINT DEFAULT 0,
  ec_srv_skill_dev    TINYINT DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_term (student_id, term)
);

-- Extra activities (array)
CREATE TABLE IF NOT EXISTS academic_record_activities (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_id   INT UNSIGNED NOT NULL,
  activity    VARCHAR(255) NOT NULL,
  FOREIGN KEY (record_id) REFERENCES academic_records(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- ATTENDANCE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT UNSIGNED NOT NULL,
  grade         VARCHAR(20)  NOT NULL,
  section       VARCHAR(20)  NOT NULL,
  date          DATE         NOT NULL,
  academic_year VARCHAR(50)  DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_faculty_date (faculty_id, date),
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  log_id          INT UNSIGNED NOT NULL,
  student_id      INT UNSIGNED NOT NULL,
  status          ENUM('Present','Absent','Late','Half-Day') DEFAULT 'Present',
  remarks         VARCHAR(500) DEFAULT '',
  FOREIGN KEY (log_id)     REFERENCES attendance_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)        ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);

-- ──────────────────────────────────────────────────────────
-- BEHAVIOR LOGS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT UNSIGNED NOT NULL,
  grade         VARCHAR(20)  NOT NULL,
  section       VARCHAR(20)  NOT NULL,
  date          DATE         NOT NULL,
  academic_year VARCHAR(50)  DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_faculty_date (faculty_id, date),
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS behavior_records (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  log_id      INT UNSIGNED NOT NULL,
  student_id  INT UNSIGNED NOT NULL,
  score       TINYINT DEFAULT 10,
  remarks     VARCHAR(500) DEFAULT '',
  FOREIGN KEY (log_id)     REFERENCES behavior_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)      ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);

-- ──────────────────────────────────────────────────────────
-- ANNOUNCEMENTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(500)  NOT NULL,
  message         TEXT          NOT NULL,
  type            ENUM('GLOBAL','CLASS','FACULTY') DEFAULT 'GLOBAL',
  created_by      INT UNSIGNED  NOT NULL,
  created_by_role ENUM('admin','faculty') NOT NULL,
  target_grade    VARCHAR(20)   DEFAULT NULL,
  target_section  VARCHAR(20)   DEFAULT NULL,
  is_published    TINYINT(1)    DEFAULT 1,
  priority        ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by)
);

CREATE TABLE IF NOT EXISTS announcement_recipients (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  UNIQUE KEY uq_ann_user (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcement_dismissed_by (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  UNIQUE KEY uq_ann_dismissed (announcement_id, user_id)
);

-- ──────────────────────────────────────────────────────────
-- HOMEWORK
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homework (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id    INT UNSIGNED NOT NULL,
  grade         VARCHAR(20)  NOT NULL,
  section       VARCHAR(20)  NOT NULL,
  subject       VARCHAR(100) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   TEXT         NOT NULL,
  due_date      DATETIME     NOT NULL,
  submission_deadline DATETIME DEFAULT NULL,
  assigned_date DATETIME     DEFAULT CURRENT_TIMESTAMP,
  archived      TINYINT(1)   DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_grade_section_archived (grade, section, archived),
  INDEX idx_faculty_id (faculty_id)
);

-- ──────────────────────────────────────────────────────────
-- HOMEWORK SUBMISSIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homework_submissions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  homework_id     INT UNSIGNED NOT NULL,
  student_id      INT UNSIGNED NOT NULL,
  parent_id       INT UNSIGNED DEFAULT NULL,
  pdf_data        LONGBLOB     DEFAULT NULL,
  pdf_filename    VARCHAR(255) DEFAULT NULL,
  pdf_size        INT          DEFAULT NULL,
  uploaded_at     DATETIME     DEFAULT NULL,
  expires_at      DATETIME     DEFAULT NULL,
  score           DECIMAL(5,2) DEFAULT NULL,
  remarks         TEXT         DEFAULT NULL,
  graded_by       INT UNSIGNED DEFAULT NULL,
  graded_at       DATETIME     DEFAULT NULL,
  status          ENUM('pending','submitted','graded') DEFAULT 'pending',
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (graded_by)   REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_homework_id (homework_id),
  INDEX idx_student_id (student_id),
  INDEX idx_expires_at (expires_at)
);

-- ──────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  type        ENUM('ATTENDANCE_ALERT','MARKS_UPDATED','HOMEWORK_ISSUED','GENERAL','FEE_ALERT') NOT NULL,
  message     TEXT NOT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ──────────────────────────────────────────────────────────
-- PASSWORD RESETS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  srv_number    VARCHAR(50)  NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  status        ENUM('Pending','Reset') DEFAULT 'Pending',
  new_password  VARCHAR(255) DEFAULT '',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_srv_number (srv_number)
);

-- ──────────────────────────────────────────────────────────
-- POLLS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(500) NOT NULL,
  description     TEXT         DEFAULT '',
  status          ENUM('DRAFT','ACTIVE','CLOSED') DEFAULT 'ACTIVE',
  is_published    TINYINT(1)   DEFAULT 1,
  target_type     ENUM('GLOBAL','CLASS') DEFAULT 'CLASS',
  target_grade    VARCHAR(20)  DEFAULT NULL,
  target_section  VARCHAR(20)  DEFAULT NULL,
  closes_at       DATETIME     DEFAULT NULL,
  created_by      INT UNSIGNED NOT NULL,
  created_by_role ENUM('admin','faculty') NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by),
  INDEX idx_target (target_type, target_grade, target_section, status)
);

CREATE TABLE IF NOT EXISTS poll_questions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  poll_id       INT UNSIGNED NOT NULL,
  prompt        TEXT         NOT NULL,
  allow_other   TINYINT(1)   DEFAULT 0,
  is_required   TINYINT(1)   DEFAULT 1,
  sort_order    INT          DEFAULT 0,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  INDEX idx_poll_id (poll_id)
);

CREATE TABLE IF NOT EXISTS poll_question_options (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  sort_order  INT DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES poll_questions(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- POLL RESPONSES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_responses (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  poll_id       INT UNSIGNED NOT NULL,
  respondent_id INT UNSIGNED NOT NULL,
  student_id    INT UNSIGNED NOT NULL,
  responded_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_poll_respondent (poll_id, respondent_id),
  FOREIGN KEY (poll_id)       REFERENCES polls(id)    ON DELETE CASCADE,
  FOREIGN KEY (respondent_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (student_id)    REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_answers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  response_id     INT UNSIGNED NOT NULL,
  question_id     INT UNSIGNED NOT NULL,
  selected_option VARCHAR(500) NOT NULL,
  other_text      VARCHAR(500) DEFAULT '',
  FOREIGN KEY (response_id) REFERENCES poll_responses(id)  ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES poll_questions(id)  ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- EVENTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title                   VARCHAR(500) NOT NULL,
  description             TEXT         NOT NULL,
  venue                   VARCHAR(255) DEFAULT '',
  event_date              DATETIME     NOT NULL,
  target_type             ENUM('GLOBAL','CLASS') DEFAULT 'CLASS',
  target_grade            VARCHAR(20)  DEFAULT NULL,
  target_section          VARCHAR(20)  DEFAULT NULL,
  created_by              INT UNSIGNED NOT NULL,
  created_by_role         ENUM('admin','faculty') NOT NULL,
  status                  ENUM('ACTIVE','CLOSED','CANCELLED') DEFAULT 'ACTIVE',
  is_published            TINYINT(1)   DEFAULT 1,
  archived_at             DATETIME     DEFAULT NULL,
  archive_reg_count       INT          DEFAULT 0,
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_event_date (event_date),
  INDEX idx_target (target_type, target_grade, target_section, status)
);

CREATE TABLE IF NOT EXISTS event_archived_students (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id      INT UNSIGNED NOT NULL,
  student_name  VARCHAR(255) NOT NULL,
  parent_name   VARCHAR(255) DEFAULT '',
  acknowledged_at DATETIME   DEFAULT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- EVENT REGISTRATIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED NOT NULL,
  parent_id       INT UNSIGNED NOT NULL,
  student_id      INT UNSIGNED NOT NULL,
  faculty_id      INT UNSIGNED DEFAULT NULL,
  note            VARCHAR(1000) DEFAULT '',
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_parent (event_id, parent_id),
  FOREIGN KEY (event_id)   REFERENCES events(id)   ON DELETE CASCADE,
  FOREIGN KEY (parent_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS event_registration_participants (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_id INT UNSIGNED NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- FEEDBACK (parent → faculty/admin)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id     INT UNSIGNED NOT NULL,
  student_id    INT UNSIGNED NOT NULL,
  faculty_id    INT UNSIGNED DEFAULT NULL,
  student_name  VARCHAR(255) NOT NULL,
  grade         VARCHAR(20)  NOT NULL,
  section       VARCHAR(20)  NOT NULL,
  category      ENUM('ISSUE','SUGGESTION','CONCERN') NOT NULL,
  subject       VARCHAR(500) NOT NULL,
  message       TEXT         NOT NULL,
  status        ENUM('OPEN','IN_REVIEW','RESOLVED') DEFAULT 'OPEN',
  staff_note    TEXT         DEFAULT '',
  updated_by    INT UNSIGNED DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_faculty_id (faculty_id),
  INDEX idx_parent_id  (parent_id),
  INDEX idx_status     (status)
);

-- ──────────────────────────────────────────────────────────
-- FOOD MENU
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_menu (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  day         ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL UNIQUE,
  breakfast   TEXT DEFAULT '',
  lunch       TEXT DEFAULT '',
  snacks      TEXT DEFAULT '',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────
-- MEMORIES (Cloudinary metadata)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(500) NOT NULL,
  description         TEXT         DEFAULT '',
  secure_url          TEXT         NOT NULL,
  public_id           VARCHAR(500) DEFAULT '',
  resource_type       ENUM('image','video') NOT NULL,
  bytes               BIGINT       DEFAULT 0,
  format              VARCHAR(20)  DEFAULT '',
  original_filename   VARCHAR(255) DEFAULT '',
  folder              VARCHAR(255) DEFAULT '',
  uploaded_by         INT UNSIGNED NOT NULL,
  created_by_role     ENUM('admin', 'faculty') DEFAULT 'admin',
  student_id          INT UNSIGNED DEFAULT NULL,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- ENQUIRIES (Admission CRM)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_name          VARCHAR(255) NOT NULL,
  parent_name           VARCHAR(255) DEFAULT '',
  parent_mobile         VARCHAR(20)  DEFAULT '',
  email                 VARCHAR(255) DEFAULT '',
  grade                 VARCHAR(20)  DEFAULT '',
  section               VARCHAR(20)  DEFAULT '',
  date_of_birth         DATE         DEFAULT NULL,
  address               TEXT         DEFAULT '',
  mother_name           VARCHAR(255) DEFAULT '',
  father_name           VARCHAR(255) DEFAULT '',
  guardian_name         VARCHAR(255) DEFAULT '',
  source                ENUM('Walk-in','Phone','WhatsApp','Website','Referral','Other') DEFAULT 'Walk-in',
  program_interest      ENUM('General','CDC','SUITS','SRV Skill Development') DEFAULT 'General',
  remarks               TEXT         DEFAULT '',
  referred_by           INT UNSIGNED DEFAULT NULL,
  status                ENUM('New','Contacted','Interested','Not Interested','Converted') DEFAULT 'New',
  lead_score            TINYINT      DEFAULT 0,
  lead_temperature      ENUM('Hot','Warm','Cold') DEFAULT 'Cold',
  last_follow_up        DATETIME     DEFAULT NULL,
  next_follow_up        DATETIME     DEFAULT NULL,
  follow_up_count       INT          DEFAULT 0,
  converted_student_id  INT UNSIGNED DEFAULT NULL,
  converted_at          DATETIME     DEFAULT NULL,
  created_by            INT UNSIGNED DEFAULT NULL,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by)          REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (converted_student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)           REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_status     (status),
  INDEX idx_lead_score (lead_score)
);

CREATE TABLE IF NOT EXISTS enquiry_interactions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enquiry_id  INT UNSIGNED NOT NULL,
  type        ENUM('Call','WhatsApp','Email','Meeting','SMS','Note') NOT NULL,
  notes       TEXT         DEFAULT '',
  by_user_id  INT UNSIGNED DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (by_user_id) REFERENCES users(id)     ON DELETE SET NULL
);

-- ──────────────────────────────────────────────────────────
-- FACULTY TASKS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  description TEXT         NOT NULL,
  task_type   ENUM('General','CDC','SUITS','SRV Skill Development','Extracurricular') DEFAULT 'General',
  deadline    DATETIME     NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  target_all  TINYINT(1)   DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty_task_assignees (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_task_user (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES faculty_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)         ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- TASK SUBMISSIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_submissions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id      INT UNSIGNED NOT NULL,
  task_id         INT UNSIGNED NOT NULL,
  proof_url       TEXT         DEFAULT NULL,
  proof_type      ENUM('image','video','document','link','none') DEFAULT 'image',
  comments        TEXT         DEFAULT NULL,
  status          ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  quality_score   TINYINT      DEFAULT 0,
  admin_feedback  TEXT         DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_faculty_task (faculty_id, task_id),
  FOREIGN KEY (faculty_id) REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (task_id)    REFERENCES faculty_tasks(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- STUDENT FEEDBACK (student rates faculty)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_feedback (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id          INT UNSIGNED NOT NULL,
  faculty_id          INT UNSIGNED NOT NULL,
  rating_teaching     TINYINT      NOT NULL,
  rating_communication TINYINT     NOT NULL,
  rating_support      TINYINT      NOT NULL,
  comments            TEXT         DEFAULT NULL,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- PROGRAM CONTRIBUTIONS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_contributions (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faculty_id          INT UNSIGNED NOT NULL,
  program_name        ENUM('Extracurricular','CDC','SUITS','SRV Skill Development','General') NOT NULL,
  hours_contributed   DECIMAL(6,2) DEFAULT 0,
  participation_level ENUM('Active','Moderate','Low','None') DEFAULT 'Active',
  month               VARCHAR(7)   DEFAULT NULL,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────
-- SETTINGS (key-value store)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`       VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT         NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────
-- TIMETABLES (Class Schedules)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetables (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grade           VARCHAR(20) NOT NULL,
  section         VARCHAR(20) NOT NULL,
  day_of_week     ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
  period_number   TINYINT NOT NULL,
  start_time      VARCHAR(10) DEFAULT '',
  end_time        VARCHAR(10) DEFAULT '',
  subject         VARCHAR(100) DEFAULT '',
  teacher_name    VARCHAR(255) DEFAULT '',
  room            VARCHAR(50) DEFAULT '',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_class_day_period (grade, section, day_of_week, period_number),
  INDEX idx_grade_section (grade, section)
);

-- ──────────────────────────────────────────────────────────
-- LEAVE REQUESTS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id      INT UNSIGNED NOT NULL,
  parent_id       INT UNSIGNED DEFAULT NULL,
  leave_type      ENUM('SICK','PERSONAL','FAMILY','OTHER') DEFAULT 'OTHER',
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT DEFAULT '',
  status          ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by     INT UNSIGNED DEFAULT NULL,
  review_note     TEXT DEFAULT '',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status)
);

-- ──────────────────────────────────────────────────────────
-- CIRCULARS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circulars (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(500) NOT NULL,
  description     TEXT DEFAULT '',
  file_url        TEXT DEFAULT '',
  target_type     ENUM('GLOBAL','CLASS') DEFAULT 'GLOBAL',
  target_grade    VARCHAR(20) DEFAULT NULL,
  target_section  VARCHAR(20) DEFAULT NULL,
  created_by      INT UNSIGNED NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_target (target_type, target_grade, target_section)
);

-- ──────────────────────────────────────────────────────────
-- TRANSPORT ROUTES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transport_routes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_name      VARCHAR(255) NOT NULL,
  bus_number      VARCHAR(50) DEFAULT '',
  driver_name     VARCHAR(255) DEFAULT '',
  driver_phone    VARCHAR(20) DEFAULT '',
  helper_name     VARCHAR(255) DEFAULT '',
  helper_phone    VARCHAR(20) DEFAULT '',
  is_active       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_stops (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id        INT UNSIGNED NOT NULL,
  stop_name       VARCHAR(255) NOT NULL,
  pickup_time     VARCHAR(10) DEFAULT '',
  drop_time       VARCHAR(10) DEFAULT '',
  sort_order      INT DEFAULT 0,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_transport (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id      INT UNSIGNED NOT NULL UNIQUE,
  route_id        INT UNSIGNED NOT NULL,
  stop_id         INT UNSIGNED DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES transport_stops(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- ──────────────────────────────────────────────────────────
-- SEED: Default admin user (password: admin123 — change immediately!)
-- bcrypt hash of "admin123" with salt rounds 10
-- ──────────────────────────────────────────────────────────
-- INSERT INTO users (name, srv_number, password, role)
-- VALUES ('Administrator', 'ADMIN001', '$2b$10$K2C7/s/nAsdIkrOhmbAHLu8e3oUjX5g3QyOz5Rbg3SbnCm2gKDYrK', 'admin');
