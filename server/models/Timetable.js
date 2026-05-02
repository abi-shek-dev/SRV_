import pool from '../db/pool.js';

const Timetable = {
  /**
   * Get full weekly schedule for a class
   */
  async findByClass(grade, section) {
    const [rows] = await pool.query(
      `SELECT * FROM timetables WHERE grade = ? AND section = ? ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI','SAT'), period_number`,
      [grade, section]
    );
    return rows.map(mapRow);
  },

  /**
   * Get schedule for a single day
   */
  async findByClassAndDay(grade, section, dayOfWeek) {
    const [rows] = await pool.query(
      `SELECT * FROM timetables WHERE grade = ? AND section = ? AND day_of_week = ? ORDER BY period_number`,
      [grade, section, dayOfWeek]
    );
    return rows.map(mapRow);
  },

  /**
   * Bulk upsert: delete all periods for a class + re-insert
   */
  async bulkUpsert(grade, section, periods = []) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Clear existing
      await conn.query('DELETE FROM timetables WHERE grade = ? AND section = ?', [grade, section]);
      // Insert new
      if (periods.length > 0) {
        // Deduplicate periods by dayOfWeek and periodNumber to prevent MySQL duplicate entry errors
        const uniqueMap = new Map();
        periods.forEach(p => uniqueMap.set(`${p.dayOfWeek}-${p.periodNumber}`, p));
        const uniquePeriods = Array.from(uniqueMap.values());

        const values = uniquePeriods.map(p => [
          grade, section, p.dayOfWeek, p.periodNumber,
          p.startTime || '', p.endTime || '', p.subject || '', p.teacherName || '', p.room || ''
        ]);
        await conn.query(
          `INSERT INTO timetables (grade, section, day_of_week, period_number, start_time, end_time, subject, teacher_name, room) VALUES ?`,
          [values]
        );
      }
      await conn.commit();
      return { grade, section, count: periods.length };
    } catch (err) {
      await conn.rollback();
      console.error('[Timetable.bulkUpsert Error]', err.message);
      console.error('Periods received:', JSON.stringify(periods, null, 2));
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete all periods for a class
   */
  async deleteByClass(grade, section) {
    const [result] = await pool.query('DELETE FROM timetables WHERE grade = ? AND section = ?', [grade, section]);
    return { deleted: result.affectedRows };
  }
};

function mapRow(r) {
  return {
    _id: r.id,
    grade: r.grade,
    section: r.section,
    dayOfWeek: r.day_of_week,
    periodNumber: r.period_number,
    startTime: r.start_time,
    endTime: r.end_time,
    subject: r.subject,
    teacherName: r.teacher_name,
    room: r.room
  };
}

export default Timetable;
