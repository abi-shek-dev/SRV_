import pool from '../db/pool.js';

// Load questions + options for a poll
async function loadQuestions(pollId) {
  const [qs] = await pool.query(
    'SELECT * FROM poll_questions WHERE poll_id = ? ORDER BY sort_order ASC', [pollId]
  );
  for (const q of qs) {
    const [opts] = await pool.query(
      'SELECT option_text FROM poll_question_options WHERE question_id = ? ORDER BY sort_order ASC', [q.id]
    );
    q.options = opts.map(o => o.option_text);
  }
  return qs.map(q => ({
    _id: q.id, id: q.id, prompt: q.prompt,
    options: q.options, allowOther: Boolean(q.allow_other), required: Boolean(q.is_required)
  }));
}

const row2poll = async (r) => {
  if (!r) return null;
  const questions = await loadQuestions(r.id);
  return {
    _id: r.id, id: r.id,
    title: r.title, description: r.description,
    status: r.status, isPublished: Boolean(r.is_published),
    targetType: r.target_type, targetGrade: r.target_grade, targetSection: r.target_section,
    closesAt: r.closes_at,
    createdBy: r.created_by, createdByRole: r.created_by_role,
    questions,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  const colMap = { createdBy: 'created_by', status: 'status', targetType: 'target_type',
                   targetGrade: 'target_grade', targetSection: 'target_section', isPublished: 'is_published' };
  let sql = 'SELECT * FROM polls';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2poll));
}

// Complex query for faculty: createdBy OR (admin global) OR (admin class)
export async function findForFaculty(createdById, classFilter) {
  let sql = `SELECT DISTINCT p.* FROM polls p WHERE 
    p.created_by = ? OR p.created_by_role = 'admin' AND p.target_type = 'GLOBAL'`;
  const vals = [createdById];
  if (classFilter) {
    sql += ` OR (p.created_by_role = 'admin' AND p.target_type = 'CLASS' AND p.target_grade = ? AND p.target_section = ?)`;
    vals.push(classFilter.grade, classFilter.section);
  }
  sql += ' ORDER BY p.created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2poll));
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM polls WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2poll(rows[0]) : null;
}

export async function findOne(where) {
  const colMap = { createdBy: 'created_by' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM polls WHERE ${conds} LIMIT 1`, Object.values(where));
  return rows[0] ? row2poll(rows[0]) : null;
}

export async function create(data) {
  const { title, description = '', status = 'ACTIVE', isPublished = true, targetType,
          targetGrade, targetSection, closesAt, createdBy, createdByRole, questions = [] } = data;
  const [result] = await pool.query(
    `INSERT INTO polls (title, description, status, is_published, target_type, target_grade,
      target_section, closes_at, created_by, created_by_role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, status, isPublished ? 1 : 0, targetType,
     targetGrade || null, targetSection || null, closesAt || null, createdBy, createdByRole]
  );
  const pollId = result.insertId;
  await _setQuestions(pollId, questions);
  return findById(pollId);
}

export async function save(obj) {
  await pool.query(
    `UPDATE polls SET title=?, description=?, status=?, is_published=?, target_type=?,
      target_grade=?, target_section=?, closes_at=? WHERE id=?`,
    [obj.title, obj.description, obj.status, obj.isPublished ? 1 : 0,
     obj.targetType, obj.targetGrade || null, obj.targetSection || null,
     obj.closesAt || null, obj._id]
  );
  if (obj.questions !== undefined) await _setQuestions(obj._id, obj.questions);
  return findById(obj._id);
}

export async function findByIdAndDelete(id) {
  const poll = await findById(id);
  if (poll) await pool.query('DELETE FROM polls WHERE id = ?', [id]);
  return poll;
}

export async function findOneAndDelete(where) {
  const poll = await findOne(where);
  if (poll) await pool.query('DELETE FROM polls WHERE id = ?', [poll._id]);
  return poll;
}

export async function countDocuments(where = {}) {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM polls');
  return rows[0].cnt;
}

async function _setQuestions(pollId, questions) {
  await pool.query('DELETE FROM poll_questions WHERE poll_id = ?', [pollId]);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const [res] = await pool.query(
      `INSERT INTO poll_questions (poll_id, prompt, allow_other, is_required, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [pollId, q.prompt, q.allowOther ? 1 : 0, q.required !== false ? 1 : 0, i]
    );
    const qId = res.insertId;
    if (q.options?.length) {
      const optRows = q.options.map((opt, j) => [qId, opt, j]);
      await pool.query(
        'INSERT INTO poll_question_options (question_id, option_text, sort_order) VALUES ?', [optRows]
      );
    }
  }
}

// Active polls visible to a parent (GLOBAL + CLASS for their grade/section, not expired)
export async function findForParent(grade, section) {
  const now = new Date();
  const [rows] = await pool.query(
    `SELECT * FROM polls
     WHERE is_published = 1 AND status = 'ACTIVE'
       AND (closes_at IS NULL OR closes_at >= ?)
       AND (target_type = 'GLOBAL'
            OR (target_type = 'CLASS' AND target_grade = ? AND target_section = ?))
     ORDER BY created_at DESC`,
    [now, grade, section]
  );
  return Promise.all(rows.map(row2poll));
}

// Find a single active poll by id, available to a parent (used in respond route)
export async function findOneForParent(pollId, grade, section) {
  const now = new Date();
  const [rows] = await pool.query(
    `SELECT * FROM polls
     WHERE id = ? AND is_published = 1 AND status = 'ACTIVE'
       AND (closes_at IS NULL OR closes_at >= ?)
       AND (target_type = 'GLOBAL'
            OR (target_type = 'CLASS' AND target_grade = ? AND target_section = ?))
     LIMIT 1`,
    [pollId, now, grade, section]
  );
  return rows[0] ? row2poll(rows[0]) : null;
}

export default {
  find, findForFaculty, findForParent, findOneForParent,
  findById, findOne, create, save,
  findByIdAndDelete, findOneAndDelete, countDocuments
};
