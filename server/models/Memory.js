import pool from '../db/pool.js';

const r2m = (r) => !r ? null : {
  _id: r.id, id: r.id,
  title: r.title, description: r.description,
  secureUrl: r.secure_url, publicId: r.public_id,
  resourceType: r.resource_type, bytes: r.bytes,
  format: r.format, originalFilename: r.original_filename,
  folder: r.folder, uploadedBy: r.uploaded_by, createdByRole: r.created_by_role,
  createdAt: r.created_at, updatedAt: r.updated_at
};

export async function find(where = {}, opts = {}) {
  let sql = 'SELECT * FROM memories ORDER BY created_at DESC';
  const [rows] = await pool.query(sql);
  return rows.map(r2m);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM memories WHERE id = ? LIMIT 1', [id]);
  return r2m(rows[0]);
}

export async function findOne(where) {
  const colMap = { publicId: 'public_id' };
  const keys = Object.keys(where);
  const conds = keys.map(k => `\`${colMap[k] || k}\` = ?`).join(' AND ');
  const [rows] = await pool.query(`SELECT * FROM memories WHERE ${conds} LIMIT 1`, Object.values(where));
  return r2m(rows[0]);
}

export async function create(data) {
  const { title, description = '', secureUrl, publicId = '', resourceType,
          bytes = 0, format = '', originalFilename = '', folder = '', uploadedBy, createdByRole = 'admin' } = data;
  const [result] = await pool.query(
    `INSERT INTO memories (title, description, secure_url, public_id, resource_type,
      bytes, format, original_filename, folder, uploaded_by, created_by_role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, secureUrl, publicId, resourceType,
     bytes, format, originalFilename, folder, uploadedBy, createdByRole]
  );
  return findById(result.insertId);
}

export async function findByIdAndDelete(id) {
  const m = await findById(id);
  if (m) await pool.query('DELETE FROM memories WHERE id = ?', [id]);
  return m;
}

export async function findOneAndDelete(where) {
  const m = await findOne(where);
  if (m) await pool.query('DELETE FROM memories WHERE id = ?', [m._id]);
  return m;
}

export default { find, findById, findOne, create, findByIdAndDelete, findOneAndDelete };
