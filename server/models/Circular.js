import pool from '../db/pool.js';

const Circular = {
  async create({ title, description, fileUrl, targetType, targetGrade, targetSection, createdBy }) {
    const [result] = await pool.query(
      `INSERT INTO circulars (title, description, file_url, target_type, target_grade, target_section, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', fileUrl || '', targetType || 'GLOBAL', targetGrade || null, targetSection || null, createdBy]
    );
    return { _id: result.insertId, title, description, fileUrl, targetType, targetGrade, targetSection };
  },

  async findAll(filters = {}) {
    let sql = `SELECT c.*, u.name AS createdByName FROM circulars c LEFT JOIN users u ON c.created_by = u.id`;
    const params = [];
    const conds = [];
    if (filters.targetGrade) { conds.push(`(c.target_type = 'GLOBAL' OR (c.target_grade = ? AND c.target_section = ?))`); params.push(filters.targetGrade, filters.targetSection || ''); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY c.created_at DESC LIMIT 100';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapRow);
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT c.*, u.name AS createdByName FROM circulars c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = ?`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM circulars WHERE id = ?', [id]);
    return { deleted: result.affectedRows };
  }
};

function mapRow(r) {
  return {
    _id: r.id, title: r.title, description: r.description,
    fileUrl: r.file_url, targetType: r.target_type,
    targetGrade: r.target_grade, targetSection: r.target_section,
    createdBy: r.created_by, createdByName: r.createdByName || '',
    createdAt: r.created_at
  };
}

export default Circular;
