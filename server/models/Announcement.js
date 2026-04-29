import pool from '../db/pool.js';

const row2ann = async (r) => {
  if (!r) return null;
  const [recips] = await pool.query(
    'SELECT user_id FROM announcement_recipients WHERE announcement_id = ?', [r.id]
  );
  const [dismissed] = await pool.query(
    'SELECT user_id FROM announcement_dismissed_by WHERE announcement_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    title: r.title, message: r.message,
    type: r.type,
    createdBy: r.created_by, createdByRole: r.created_by_role,
    targetGrade: r.target_grade, targetSection: r.target_section,
    isPublished: Boolean(r.is_published),
    priority: r.priority,
    recipients: recips.map(x => x.user_id),
    dismissedBy: dismissed.map(x => x.user_id),
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  // Support complex queries built as raw SQL
  let sql = 'SELECT * FROM announcements';
  const vals = [];
  const colMap = { createdBy: 'created_by', isPublished: 'is_published', type: 'type' };
  const keys = Object.keys(where);
  if (keys.length) {
    const conds = [];
    for (const k of keys) {
      const col = colMap[k] || k;
      const val = where[k];
      if (val !== undefined) { conds.push(`\`${col}\` = ?`); vals.push(val); }
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  }
  sql += opts.sort ? ` ORDER BY ${opts.sort}` : ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2ann));
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2ann(rows[0]) : null;
}

export async function create(data) {
  const { title, message, type, createdBy, createdByRole, targetGrade, targetSection,
          isPublished = true, priority = 'MEDIUM', recipients = [] } = data;

  const [result] = await pool.query(
    `INSERT INTO announcements
     (title, message, type, created_by, created_by_role, target_grade, target_section, is_published, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, message, type, createdBy, createdByRole, targetGrade || null, targetSection || null,
     isPublished ? 1 : 0, priority]
  );
  const annId = result.insertId;

  if (recipients.length) {
    const rows = recipients.map(uid => [annId, uid]);
    await pool.query('INSERT IGNORE INTO announcement_recipients (announcement_id, user_id) VALUES ?', [rows]);
  }
  return findById(annId);
}

// Find all announcements accessible by a faculty: GLOBAL or FACULTY (recipient) excluding dismissed
export async function findForFaculty(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT a.* FROM announcements a
     LEFT JOIN announcement_recipients ar ON ar.announcement_id = a.id
     LEFT JOIN announcement_dismissed_by ad ON ad.announcement_id = a.id AND ad.user_id = ?
     WHERE ad.user_id IS NULL
       AND (
         (a.type = 'GLOBAL' AND a.created_by_role = 'admin') OR
         (a.type = 'FACULTY' AND a.created_by_role = 'admin' AND ar.user_id = ?)
       )
     ORDER BY a.created_at DESC`,
    [userId, userId]
  );
  return Promise.all(rows.map(row2ann));
}

export async function dismiss(announcementId, userId) {
  await pool.query(
    'INSERT IGNORE INTO announcement_dismissed_by (announcement_id, user_id) VALUES (?, ?)',
    [announcementId, userId]
  );
}

export async function findByIdAndDelete(id) {
  const ann = await findById(id);
  if (ann) await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
  return ann;
}

export async function save(obj) {
  // Called after push to dismissedBy
  // No need to update — dismiss() handles it directly
  return findById(obj._id);
}

export async function countDocuments(where = {}) {
  const colMap = { createdBy: 'created_by' };
  let sql = 'SELECT COUNT(*) AS cnt FROM announcements';
  const vals = [];
  const keys = Object.keys(where);
  if (keys.length) {
    sql += ' WHERE ' + keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
    vals.push(...Object.values(where));
  }
  const [rows] = await pool.query(sql, vals);
  return rows[0].cnt;
}

// Find announcements visible to a parent (GLOBAL or CLASS matching their grade/section, not dismissed)
export async function findForParent(userId, grade, section) {
  const [rows] = await pool.query(
    `SELECT DISTINCT a.* FROM announcements a
     LEFT JOIN announcement_dismissed_by ad ON ad.announcement_id = a.id AND ad.user_id = ?
     WHERE a.is_published = 1 AND ad.user_id IS NULL
       AND (a.type = 'GLOBAL'
            OR (a.type = 'CLASS' AND a.target_grade = ? AND a.target_section = ?))
     ORDER BY a.created_at DESC`,
    [userId, String(grade), section]
  );
  return Promise.all(rows.map(row2ann));
}

export default {
  find, findById, create, findForFaculty, findForParent, dismiss,
  findByIdAndDelete, save, countDocuments
};
