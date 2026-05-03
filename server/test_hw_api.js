import pool from './db/pool.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE role = 'faculty' LIMIT 1");
    if (users.length === 0) return console.log('no faculty found');
    const user = users[0];
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
    
    const res = await fetch('http://localhost:5001/api/faculty/homework', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        subject: 'Math',
        title: 'Api test',
        description: 'from test script',
        dueDate: '2026-05-10',
        submissionDeadline: '2026-05-10T23:59:59.000Z'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('API Error:', err.message);
  }
  process.exit();
}
run();
