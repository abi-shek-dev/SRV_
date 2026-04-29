import pool from '../db/pool.js';

const r2ts = (r) => !r ? null : {
  _id: r.id, id: r.id,
  facultyId: r.faculty_id, taskId: r.task_id,
  proofUrl: r.proof_url, proofType: r.proof_type,
  comments: r.comments, status: r.status,
  qualityScore: r.quality_score, adminFeedback: r.admin_feedback,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}) {
  const colMap = { facultyId: 'faculty_id', taskId: 'task_id', status: 'status' };
  let sql = 'SELECT * FROM task_submissions';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return rows.map(r2ts);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM task_submissions WHERE id = ? LIMIT 1', [id]);
  return r2ts(rows[0]);
}

export async function findOne(where) {
  const colMap = { facultyId: 'faculty_id', taskId: 'task_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM task_submissions WHERE ${conds} LIMIT 1`, Object.values(where));
  return r2ts(rows[0]);
}

export async function create(data) {
  const { facultyId, taskId, proofUrl, proofType = 'image', comments, status = 'Pending',
          qualityScore = 0, adminFeedback } = data;
  const [result] = await pool.query(
    `INSERT INTO task_submissions (faculty_id, task_id, proof_url, proof_type, comments, status, quality_score, admin_feedback)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [facultyId, taskId, proofUrl || null, proofType, comments || null, status, qualityScore, adminFeedback || null]
  );
  return findById(result.insertId);
}

export async function save(obj) {
  await pool.query(
    'UPDATE task_submissions SET status=?, quality_score=?, admin_feedback=?, proof_url=?, proof_type=?, comments=? WHERE id=?',
    [obj.status, obj.qualityScore, obj.adminFeedback || null,
     obj.proofUrl || null, obj.proofType, obj.comments || null, obj._id]
  );
  return findById(obj._id);
}

// Find all submissions for a list of task IDs (replaces { taskId: { $in: [...] } })
export async function findByTaskIds(taskIds) {
  if (!taskIds.length) return [];
  const placeholders = taskIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT * FROM task_submissions WHERE task_id IN (${placeholders}) ORDER BY created_at DESC`,
    taskIds
  );
  return rows.map(r2ts);
}

// Delete all submissions for a task
export async function deleteMany(where) {
  const colMap = { taskId: 'task_id', facultyId: 'faculty_id' };
  const keys = Object.keys(where);
  if (!keys.length) return;
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  await pool.query(`DELETE FROM task_submissions WHERE ${conds}`, Object.values(where));
}

export async function updateById(id, data) {
  const colMap = { status: 'status', qualityScore: 'quality_score', adminFeedback: 'admin_feedback' };
  const fields = {};
  for (const [k, col] of Object.entries(colMap)) {
    if (data[k] !== undefined) fields[col] = data[k];
  }
  if (!Object.keys(fields).length) return findById(id);
  const setClauses = Object.keys(fields).map(c => `\`${c}\` = ?`).join(', ');
  await pool.query(`UPDATE task_submissions SET ${setClauses} WHERE id = ?`, [...Object.values(fields), id]);
  return findById(id);
}

export default { find, findById, findOne, findByTaskIds, create, save, updateById, deleteMany };
