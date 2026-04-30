import pool from '../db/pool.js';

const row2sub = (r) => !r ? null : {
  _id: r.id, id: r.id,
  homeworkId: r.homework_id,
  studentId: r.student_id,
  parentId: r.parent_id,
  hasPdf: Boolean(r.pdf_data),
  pdfFilename: r.pdf_filename,
  pdfSize: r.pdf_size,
  uploadedAt: r.uploaded_at,
  expiresAt: r.expires_at,
  score: r.score,
  remarks: r.remarks,
  gradedBy: r.graded_by,
  gradedAt: r.graded_at,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at
};

// Find submissions (without blob data for listing)
export async function find(where = {}) {
  const colMap = {
    homeworkId: 'homework_id',
    studentId: 'student_id',
    parentId: 'parent_id',
    status: 'status'
  };
  let sql = 'SELECT id, homework_id, student_id, parent_id, pdf_filename, pdf_size, uploaded_at, expires_at, score, remarks, graded_by, graded_at, status, created_at, updated_at FROM homework_submissions';
  const vals = [];
  const conds = Object.entries(where).map(([k, v]) => {
    vals.push(v);
    return `\`${colMap[k] || k}\` = ?`;
  });
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return rows.map(row2sub);
}

export async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, homework_id, student_id, parent_id, pdf_filename, pdf_size, uploaded_at, expires_at, score, remarks, graded_by, graded_at, status, created_at, updated_at FROM homework_submissions WHERE id = ? LIMIT 1',
    [id]
  );
  return row2sub(rows[0]);
}

export async function findOne(where = {}) {
  const colMap = {
    homeworkId: 'homework_id',
    studentId: 'student_id',
    parentId: 'parent_id'
  };
  const conds = Object.keys(where).map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(
    `SELECT id, homework_id, student_id, parent_id, pdf_filename, pdf_size, uploaded_at, expires_at, score, remarks, graded_by, graded_at, status, created_at, updated_at FROM homework_submissions WHERE ${conds} LIMIT 1`,
    Object.values(where)
  );
  return row2sub(rows[0]);
}

// Get PDF blob for serving
export async function getPdf(id) {
  const [rows] = await pool.query(
    'SELECT id, pdf_data, pdf_filename, expires_at FROM homework_submissions WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

// Upsert: create or replace submission for a student
export async function upsertSubmission({ homeworkId, studentId, parentId, pdfData, pdfFilename, pdfSize }) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const [existing] = await pool.query(
    'SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ? LIMIT 1',
    [homeworkId, studentId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE homework_submissions
       SET parent_id = ?, pdf_data = ?, pdf_filename = ?, pdf_size = ?,
           uploaded_at = NOW(), expires_at = ?, status = 'submitted', updated_at = NOW()
       WHERE homework_id = ? AND student_id = ?`,
      [parentId, pdfData, pdfFilename, pdfSize, expiresAt, homeworkId, studentId]
    );
    return findOne({ homeworkId, studentId });
  } else {
    const [result] = await pool.query(
      `INSERT INTO homework_submissions
       (homework_id, student_id, parent_id, pdf_data, pdf_filename, pdf_size, uploaded_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'submitted')`,
      [homeworkId, studentId, parentId, pdfData, pdfFilename, pdfSize, expiresAt]
    );
    return findById(result.insertId);
  }
}

// Ensure a pending row exists for a student (for manual grading without upload)
export async function ensureExists({ homeworkId, studentId }) {
  const [existing] = await pool.query(
    'SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ? LIMIT 1',
    [homeworkId, studentId]
  );
  if (existing.length === 0) {
    await pool.query(
      `INSERT INTO homework_submissions (homework_id, student_id, status) VALUES (?, ?, 'pending')`,
      [homeworkId, studentId]
    );
  }
}

// Grade a submission (or create one if faculty grades without upload)
export async function grade({ homeworkId, studentId, score, remarks, gradedBy }) {
  const [existing] = await pool.query(
    'SELECT id, status FROM homework_submissions WHERE homework_id = ? AND student_id = ? LIMIT 1',
    [homeworkId, studentId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE homework_submissions
       SET score = ?, remarks = ?, graded_by = ?, graded_at = NOW(), status = 'graded', updated_at = NOW()
       WHERE homework_id = ? AND student_id = ?`,
      [score, remarks || null, gradedBy, homeworkId, studentId]
    );
  } else {
    // Manual grade for student who didn't upload
    await pool.query(
      `INSERT INTO homework_submissions
       (homework_id, student_id, score, remarks, graded_by, graded_at, status)
       VALUES (?, ?, ?, ?, ?, NOW(), 'graded')`,
      [homeworkId, studentId, score, remarks || null, gradedBy]
    );
  }
  return findOne({ homeworkId, studentId });
}

// Auto-delete expired PDFs (keeps row but removes blob)
export async function cleanupExpiredPdfs() {
  const [result] = await pool.query(
    `UPDATE homework_submissions
     SET pdf_data = NULL, pdf_filename = NULL, pdf_size = NULL, uploaded_at = NULL
     WHERE expires_at IS NOT NULL AND expires_at < NOW() AND pdf_data IS NOT NULL`
  );
  return result.affectedRows;
}

export default { find, findById, findOne, getPdf, upsertSubmission, ensureExists, grade, cleanupExpiredPdfs };
