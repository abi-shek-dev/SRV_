import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const token = jwt.sign({ id: 'admin123', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    const payload = {
      grade: 'X',
      section: 'A',
      periods: [
        { dayOfWeek: 'MON', periodNumber: 1, startTime: '09:00', endTime: '10:00', subject: 'Math', teacherName: 'John', room: '101' },
        { dayOfWeek: 'MON', periodNumber: 1, startTime: '10:00', endTime: '11:00', subject: 'English', teacherName: 'Doe', room: '102' }
      ]
    };

    console.log("Sending POST to /api/timetable with DUPLICATES");
    const res = await fetch('http://localhost:5001/api/timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Response:", res.status, data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
