import pool from './db/pool.js';

async function run() {
  const [users] = await pool.query("SELECT id, name, role, assigned_grade, assigned_section FROM users WHERE role = 'faculty' LIMIT 1");
  console.log('Faculty user:', JSON.stringify(users[0], null, 2));
  
  const u = users[0];
  if (u) {
    const [students] = await pool.query("SELECT id, name, grade, section FROM students WHERE grade = ? AND section = ?", [u.assigned_grade, u.assigned_section]);
    console.log('Students in class:', JSON.stringify(students, null, 2));
  }
  process.exit();
}
run().catch(e => { console.error(e.message); process.exit(1); });
