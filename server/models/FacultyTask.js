import pool from '../db/pool.js';

const r2ft = async (r) => {
  if (!r) return null;
  const [assignees] = await pool.query(
    'SELECT user_id FROM faculty_task_assignees WHERE task_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    title: r.title, description: r.description, taskType: r.task_type,
    deadline: r.deadline, assignedBy: r.assigned_by,
    assignedTo: assignees.map(a => a.user_id),
    targetAll: Boolean(r.target_all), isActive: Boolean(r.is_active),
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}) {
  const colMap = { isActive: 'is_active', assignedBy: 'assigned_by' };
  let sql = 'SELECT * FROM faculty_tasks';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY deadline ASC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(r2ft));
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM faculty_tasks WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? r2ft(rows[0]) : null;
}

// Tasks assigned to a specific faculty (targetAll OR in assignees)
export async function findForFaculty(facultyId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT t.* FROM faculty_tasks t
     LEFT JOIN faculty_task_assignees a ON a.task_id = t.id
     WHERE t.is_active = 1 AND (t.target_all = 1 OR a.user_id = ?)
     ORDER BY t.deadline ASC`,
    [facultyId]
  );
  return Promise.all(rows.map(r2ft));
}

export async function create(data) {
  const { title, description, taskType = 'General', deadline, assignedBy,
          assignedTo = [], targetAll = false, isActive = true } = data;
  const [result] = await pool.query(
    `INSERT INTO faculty_tasks (title, description, task_type, deadline, assigned_by, target_all, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, taskType, deadline, assignedBy, targetAll ? 1 : 0, isActive ? 1 : 0]
  );
  const taskId = result.insertId;
  if (!targetAll && assignedTo.length) {
    const rows = assignedTo.map(uid => [taskId, uid]);
    await pool.query('INSERT IGNORE INTO faculty_task_assignees (task_id, user_id) VALUES ?', [rows]);
  }
  return findById(taskId);
}

export async function save(obj) {
  await pool.query(
    'UPDATE faculty_tasks SET title=?, description=?, task_type=?, deadline=?, target_all=?, is_active=? WHERE id=?',
    [obj.title, obj.description, obj.taskType, obj.deadline,
     obj.targetAll ? 1 : 0, obj.isActive ? 1 : 0, obj._id]
  );
  return findById(obj._id);
}

export async function findByIdAndDelete(id) {
  const t = await findById(id);
  if (t) await pool.query('DELETE FROM faculty_tasks WHERE id = ?', [id]);
  return t;
}

export default { find, findById, findForFaculty, create, save, findByIdAndDelete };
