import pool from '../db/pool.js';

const row2resp = async (r) => {
  if (!r) return null;
  const [answers] = await pool.query(
    'SELECT * FROM poll_answers WHERE response_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    pollId: r.poll_id, respondentId: r.respondent_id, studentId: r.student_id,
    answers: answers.map(a => ({
      questionId: a.question_id, selectedOption: a.selected_option, otherText: a.other_text
    })),
    respondedAt: r.responded_at,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  const colMap = { pollId: 'poll_id', respondentId: 'respondent_id', studentId: 'student_id' };
  let sql = 'SELECT * FROM poll_responses';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || k;
    if (v && v['$in']) {
      conds.push(`\`${col}\` IN (${v['$in'].map(() => '?').join(',')})`);
      vals.push(...v['$in']);
    } else { conds.push(`\`${col}\` = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY responded_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2resp));
}

export async function findOne(where) {
  const colMap = { pollId: 'poll_id', respondentId: 'respondent_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM poll_responses WHERE ${conds} LIMIT 1`, Object.values(where));
  return rows[0] ? row2resp(rows[0]) : null;
}

export async function create(data) {
  const { pollId, respondentId, studentId, answers = [], respondedAt } = data;
  const [result] = await pool.query(
    'INSERT INTO poll_responses (poll_id, respondent_id, student_id, responded_at) VALUES (?, ?, ?, ?)',
    [pollId, respondentId, studentId, respondedAt || new Date()]
  );
  const respId = result.insertId;
  if (answers.length) {
    const rows = answers.map(a => [respId, a.questionId, a.selectedOption, a.otherText || '']);
    await pool.query(
      'INSERT INTO poll_answers (response_id, question_id, selected_option, other_text) VALUES ?', [rows]
    );
  }
  return findById(respId);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM poll_responses WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2resp(rows[0]) : null;
}

export async function countDocuments(where = {}) {
  const colMap = { pollId: 'poll_id', respondentId: 'respondent_id' };
  let sql = 'SELECT COUNT(*) AS cnt FROM poll_responses';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    conds.push(`\`${colMap[k] || k}\` = ?`); vals.push(v);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  const [rows] = await pool.query(sql, vals);
  return rows[0].cnt;
}

export async function deleteMany(where) {
  const colMap = { pollId: 'poll_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  await pool.query(`DELETE FROM poll_responses WHERE ${conds}`, Object.values(where));
}

// Upsert: create or replace poll response for a respondent (replaces findOneAndUpdate with upsert)
export async function upsert(pollId, respondentId, data) {
  const { studentId, answers = [], respondedAt } = data;
  const existing = await findOne({ pollId, respondentId });
  if (existing) {
    // Delete old answers and replace
    await pool.query('DELETE FROM poll_answers WHERE response_id = ?', [existing._id]);
    if (answers.length) {
      const rows = answers.map(a => [existing._id, a.questionId, a.selectedOption, a.otherText || '']);
      await pool.query('INSERT INTO poll_answers (response_id, question_id, selected_option, other_text) VALUES ?', [rows]);
    }
    await pool.query('UPDATE poll_responses SET responded_at=?, student_id=? WHERE id=?',
      [respondedAt || new Date(), studentId, existing._id]);
    return findById(existing._id);
  } else {
    return create({ pollId, respondentId, studentId, answers, respondedAt });
  }
}

export default { find, findOne, upsert, create, findById, countDocuments, deleteMany };
