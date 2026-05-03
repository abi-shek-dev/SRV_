import pool from './db/pool.js';
import Homework from './models/Homework.js';

async function run() {
  try {
    const hw = await Homework.create({
      facultyId: 1,
      grade: 'X',
      section: 'A',
      subject: 'Math',
      title: 'Test',
      description: 'Desc',
      dueDate: '2026-05-10',
      assignedDate: new Date(),
      archived: false,
      submissionDeadline: '2026-05-10T23:59:59.000Z'
    });
    console.log(hw);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit();
}
run();
