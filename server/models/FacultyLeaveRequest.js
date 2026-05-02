import pool from '../db/pool.js';

const FacultyLeaveRequest = {
  async create({ facultyId, leaveType, startDate, endDate, reason }) {
    const [result] = await pool.query(
      `INSERT INTO faculty_leave_requests (faculty_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [facultyId, leaveType || 'OTHER', startDate, endDate, reason || '']
    );
    return { _id: result.insertId, facultyId, leaveType, startDate, endDate, reason, status: 'PENDING' };
  },

  async findByFaculty(facultyId) {
    const [rows] = await pool.query(
      `SELECT flr.*, u.name AS facultyName, rev.name AS reviewerName
       FROM faculty_leave_requests flr
       JOIN users u ON flr.faculty_id = u.id
       LEFT JOIN users rev ON flr.reviewed_by = rev.id
       WHERE flr.faculty_id = ?
       ORDER BY flr.created_at DESC`,
      [facultyId]
    );
    return rows.map(mapRow);
  },

  async findAll(filters = {}) {
    let sql = `SELECT flr.*, u.name AS facultyName, rev.name AS reviewerName
               FROM faculty_leave_requests flr
               JOIN users u ON flr.faculty_id = u.id
               LEFT JOIN users rev ON flr.reviewed_by = rev.id`;
    const params = [];
    const conditions = [];
    if (filters.status) { conditions.push('flr.status = ?'); params.push(filters.status); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY flr.created_at DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapRow);
  },

  async updateStatus(id, { status, reviewNote, reviewedBy }) {
    await pool.query(
      `UPDATE faculty_leave_requests SET status = ?, review_note = ?, reviewed_by = ? WHERE id = ?`,
      [status, reviewNote || '', reviewedBy, id]
    );
    return { _id: id, status, reviewNote };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT flr.*, u.name AS facultyName, rev.name AS reviewerName
       FROM faculty_leave_requests flr
       JOIN users u ON flr.faculty_id = u.id
       LEFT JOIN users rev ON flr.reviewed_by = rev.id
       WHERE flr.id = ?`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async countPending() {
    let sql = `SELECT COUNT(*) AS cnt FROM faculty_leave_requests WHERE status = 'PENDING'`;
    const [rows] = await pool.query(sql);
    return rows[0].cnt;
  }
};

function mapRow(r) {
  return {
    _id: r.id,
    facultyId: r.faculty_id,
    facultyName: r.facultyName || '',
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

export default FacultyLeaveRequest;
