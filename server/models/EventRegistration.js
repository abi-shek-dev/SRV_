import pool from '../db/pool.js';

const row2reg = async (r) => {
  if (!r) return null;
  const [parts] = await pool.query(
    'SELECT participant_name FROM event_registration_participants WHERE registration_id = ?', [r.id]
  );
  return {
    _id: r.id, id: r.id,
    eventId: r.event_id, parentId: r.parent_id, studentId: r.student_id, facultyId: r.faculty_id,
    participantNames: parts.map(p => p.participant_name),
    note: r.note, acknowledgedAt: r.acknowledged_at,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
};

export async function find(where = {}, opts = {}) {
  const colMap = { eventId: 'event_id', parentId: 'parent_id', studentId: 'student_id', facultyId: 'faculty_id' };
  let sql = 'SELECT * FROM event_registrations';
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || k;
    if (v && v['$in']) {
      conds.push(`\`${col}\` IN (${v['$in'].map(() => '?').join(',')})`);
      vals.push(...v['$in']);
    } else { conds.push(`\`${col}\` = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY acknowledged_at DESC, created_at DESC';
  const [rows] = await pool.query(sql, vals);
  return Promise.all(rows.map(row2reg));
}

export async function findOne(where) {
  const colMap = { eventId: 'event_id', parentId: 'parent_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(
    `SELECT * FROM event_registrations WHERE ${conds} LIMIT 1`, Object.values(where)
  );
  return rows[0] ? row2reg(rows[0]) : null;
}

export async function create(data) {
  const { eventId, parentId, studentId, facultyId = null, participantNames = [], note = '', acknowledgedAt } = data;
  const [result] = await pool.query(
    `INSERT INTO event_registrations (event_id, parent_id, student_id, faculty_id, note, acknowledged_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventId, parentId, studentId, facultyId, note, acknowledgedAt || new Date()]
  );
  const regId = result.insertId;
  if (participantNames.length) {
    const rows = participantNames.map(n => [regId, n]);
    await pool.query('INSERT INTO event_registration_participants (registration_id, participant_name) VALUES ?', [rows]);
  }
  return findById(regId);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM event_registrations WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? row2reg(rows[0]) : null;
}

export async function deleteMany(where) {
  const colMap = { eventId: 'event_id', parentId: 'parent_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  await pool.query(`DELETE FROM event_registrations WHERE ${conds}`, Object.values(where));
}

// With join data for display (populate equivalent)
export async function findWithDetails(where = {}) {
  const colMap = { eventId: 'er.event_id', facultyId: 'er.faculty_id' };
  let sql = `
    SELECT er.*,
      u.name AS parent_name, u.srv_number AS parent_srv,
      s.name AS student_name, s.srv_number AS student_srv,
      s.mother_name, s.father_name, s.guardian_name,
      f.name AS faculty_name
    FROM event_registrations er
    LEFT JOIN users u ON u.id = er.parent_id
    LEFT JOIN students s ON s.id = er.student_id
    LEFT JOIN users f ON f.id = er.faculty_id
  `;
  const vals = []; const conds = [];
  for (const [k, v] of Object.entries(where)) {
    const col = colMap[k] || `er.${k}`;
    if (v && v['$in']) {
      conds.push(`${col} IN (${v['$in'].map(() => '?').join(',')})`);
      vals.push(...v['$in']);
    } else { conds.push(`${col} = ?`); vals.push(v); }
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY er.acknowledged_at DESC, er.created_at DESC';
  const [rows] = await pool.query(sql, vals);
  const results = [];
  for (const r of rows) {
    const [parts] = await pool.query(
      'SELECT participant_name FROM event_registration_participants WHERE registration_id = ?', [r.id]
    );
    results.push({
      _id: r.id, id: r.id,
      eventId: r.event_id,
      parentId: { _id: r.parent_id, name: r.parent_name, srvNumber: r.parent_srv },
      studentId: { _id: r.student_id, name: r.student_name, srvNumber: r.student_srv,
                   motherName: r.mother_name, fatherName: r.father_name, guardianName: r.guardian_name },
      facultyId: r.faculty_id ? { _id: r.faculty_id, name: r.faculty_name } : null,
      participantNames: parts.map(p => p.participant_name),
      note: r.note, acknowledgedAt: r.acknowledged_at,
      createdAt: r.created_at, updatedAt: r.updated_at
    });
  }
  return results;
}

// Upsert: create or replace event registration for a parent (replaces findOneAndUpdate upsert)
export async function upsert(eventId, parentId, data) {
  const { studentId, facultyId = null, participantNames = [], note = '', acknowledgedAt } = data;
  const existing = await findOne({ eventId, parentId });
  if (existing) {
    // Update existing registration
    await pool.query(
      'UPDATE event_registrations SET student_id=?, faculty_id=?, note=?, acknowledged_at=? WHERE id=?',
      [studentId, facultyId, note, acknowledgedAt || new Date(), existing._id]
    );
    // Replace participants
    await pool.query('DELETE FROM event_registration_participants WHERE registration_id = ?', [existing._id]);
    if (participantNames.length) {
      const rows = participantNames.map(n => [existing._id, n]);
      await pool.query('INSERT INTO event_registration_participants (registration_id, participant_name) VALUES ?', [rows]);
    }
    return findById(existing._id);
  } else {
    return create({ eventId, parentId, studentId, facultyId, participantNames, note, acknowledgedAt });
  }
}

export default { find, findOne, upsert, create, findById, deleteMany, findWithDetails };
