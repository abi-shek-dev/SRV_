import pool from '../db/pool.js';

const row2event = async (r) => {
  if (!r) return null;
  const [archived] = await pool.query(
    'SELECT * FROM event_archived_students WHERE event_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    title: r.title, description: r.description, venue: r.venue,
    eventDate: r.event_date,
    targetType: r.target_type, targetGrade: r.target_grade, targetSection: r.target_section,
    createdBy: r.created_by, createdByRole: r.created_by_role,
    status: r.status, isPublished: Boolean(r.is_published),
    archivedAt: r.archived_at,
    archiveSummary: {
      registrationCount: r.archive_reg_count || 0,
      enrolledStudents: archived.map(s => ({
        studentName: s.student_name, parentName: s.parent_name, acknowledgedAt: s.acknowledged_at
      }))
    },
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  const colMap = { createdBy: 'created_by', status: 'status', targetType: 'target_type' };
  let sql = 'SELECT * FROM events';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += opts.sort ? ` ORDER BY ${opts.sort}` : ' ORDER BY event_date ASC, created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2event));
}

// Past events not yet archived
export async function findExpiredActive() {
  const today = new Date(); today.setHours(0,0,0,0);
  const [rows] = await pool.query(
    `SELECT * FROM events WHERE event_date < ? AND status != 'CANCELLED' AND archived_at IS NULL`,
    [today]
  );
  return Promise.all(rows.map(row2event));
}

// Faculty: own + admin global + admin class
export async function findForFaculty(createdById, classFilter) {
  let sql = `SELECT DISTINCT e.* FROM events e WHERE 
    e.created_by = ? OR (e.created_by_role = 'admin' AND e.target_type = 'GLOBAL')`;
  const vals = [createdById];
  if (classFilter) {
    sql += ` OR (e.created_by_role = 'admin' AND e.target_type = 'CLASS' AND e.target_grade = ? AND e.target_section = ?)`;
    vals.push(classFilter.grade, classFilter.section);
  }
  sql += ' ORDER BY e.event_date ASC, e.created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2event));
}

export async function findForParent(grade, section) {
  const [rows] = await pool.query(
    `SELECT * FROM events WHERE status = 'ACTIVE' AND is_published = 1
     AND (target_type = 'GLOBAL' OR (target_type = 'CLASS' AND target_grade = ? AND target_section = ?))
     ORDER BY event_date ASC`,
    [grade, section]
  );
  return Promise.all(rows.map(row2event));
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2event(rows[0]) : null;
}

export async function create(data) {
  const { title, description, venue = '', eventDate, targetType, targetGrade, targetSection,
          createdBy, createdByRole, status = 'ACTIVE', isPublished = true } = data;
  const [result] = await pool.query(
    `INSERT INTO events (title, description, venue, event_date, target_type, target_grade,
      target_section, created_by, created_by_role, status, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, venue, eventDate, targetType, targetGrade || null,
     targetSection || null, createdBy, createdByRole, status, isPublished ? 1 : 0]
  );
  return findById(result.insertId);
}

export async function save(obj) {
  await pool.query(
    `UPDATE events SET title=?, description=?, venue=?, event_date=?, target_type=?,
      target_grade=?, target_section=?, status=?, is_published=?, archived_at=?, archive_reg_count=?
     WHERE id=?`,
    [obj.title, obj.description, obj.venue, obj.eventDate, obj.targetType,
     obj.targetGrade || null, obj.targetSection || null, obj.status,
     obj.isPublished ? 1 : 0, obj.archivedAt || null,
     obj.archiveSummary?.registrationCount || 0, obj._id]
  );
  if (obj.archiveSummary?.enrolledStudents?.length) {
    await pool.query('DELETE FROM event_archived_students WHERE event_id = ?', [obj._id]);
    const rows = obj.archiveSummary.enrolledStudents.map(s =>
      [obj._id, s.studentName, s.parentName || '', s.acknowledgedAt || null]
    );
    await pool.query(
      'INSERT INTO event_archived_students (event_id, student_name, parent_name, acknowledged_at) VALUES ?', [rows]
    );
  }
  return findById(obj._id);
}

export async function findByIdAndDelete(id) {
  const event = await findById(id);
  if (event) await pool.query('DELETE FROM events WHERE id = ?', [id]);
  return event;
}

export async function countDocuments() {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM events');
  return rows[0].cnt;
}

export default {
  find, findExpiredActive, findForFaculty, findForParent, findById,
  create, save, findByIdAndDelete, countDocuments
};
