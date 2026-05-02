import pool from '../db/pool.js';

const LeaveRequest = {
  async create({ studentId, parentId, leaveType, startDate, endDate, reason }) {
    const [result] = await pool.query(
      `INSERT INTO leave_requests (student_id, parent_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [studentId, parentId, leaveType || 'OTHER', startDate, endDate, reason || '']
    );
    return { _id: result.insertId, studentId, parentId, leaveType, startDate, endDate, reason, status: 'PENDING' };
  },

  async findByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT lr.*, s.name AS studentName, s.grade, s.section,
              u.name AS parentName, rev.name AS reviewerName
       FROM leave_requests lr
       JOIN students s ON lr.student_id = s.id
       LEFT JOIN users u ON lr.parent_id = u.id
       LEFT JOIN users rev ON lr.reviewed_by = rev.id
       WHERE lr.student_id = ?
       ORDER BY lr.created_at DESC`,
      [studentId]
    );
    return rows.map(mapRow);
  },

  async findByClass(grade, section) {
    const [rows] = await pool.query(
      `SELECT lr.*, s.name AS studentName, s.grade, s.section,
              u.name AS parentName, rev.name AS reviewerName
       FROM leave_requests lr
       JOIN students s ON lr.student_id = s.id
       LEFT JOIN users u ON lr.parent_id = u.id
       LEFT JOIN users rev ON lr.reviewed_by = rev.id
       WHERE s.grade = ? AND s.section = ?
       ORDER BY lr.created_at DESC`,
      [grade, section]
    );
    return rows.map(mapRow);
  },

  async findAll(filters = {}) {
    let sql = `SELECT lr.*, s.name AS studentName, s.grade, s.section,
                      u.name AS parentName, rev.name AS reviewerName
               FROM leave_requests lr
               JOIN students s ON lr.student_id = s.id
               LEFT JOIN users u ON lr.parent_id = u.id
               LEFT JOIN users rev ON lr.reviewed_by = rev.id`;
    const params = [];
    const conditions = [];
    if (filters.status) { conditions.push('lr.status = ?'); params.push(filters.status); }
    if (filters.grade) { conditions.push('s.grade = ?'); params.push(filters.grade); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY lr.created_at DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapRow);
  },

  async updateStatus(id, { status, reviewNote, reviewedBy }) {
    await pool.query(
      `UPDATE leave_requests SET status = ?, review_note = ?, reviewed_by = ? WHERE id = ?`,
      [status, reviewNote || '', reviewedBy, id]
    );
    return { _id: id, status, reviewNote };
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM leave_requests WHERE id = ?`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async countPending(grade, section) {
    let sql = `SELECT COUNT(*) AS cnt FROM leave_requests lr JOIN students s ON lr.student_id = s.id WHERE lr.status = 'PENDING'`;
    const params = [];
    if (grade) { sql += ' AND s.grade = ?'; params.push(grade); }
    if (section) { sql += ' AND s.section = ?'; params.push(section); }
    const [rows] = await pool.query(sql, params);
    return rows[0].cnt;
  }
};

function mapRow(r) {
  return {
    _id: r.id,
    studentId: r.student_id,
    parentId: r.parent_id,
    studentName: r.studentName || '',
    parentName: r.parentName || '',
    grade: r.grade || '',
    section: r.section || '',
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    status: r.status,
    reviewNote: r.review_note || '',
    reviewerName: r.reviewerName || '',
    reviewedBy: r.reviewed_by,
    createdAt: r.created_at
  };
}

export default LeaveRequest;
