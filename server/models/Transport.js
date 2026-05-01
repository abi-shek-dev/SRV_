import pool from '../db/pool.js';

const Transport = {
  // ── ROUTES ──
  async createRoute({ routeName, busNumber, driverName, driverPhone, helperName, helperPhone }) {
    const [result] = await pool.query(
      `INSERT INTO transport_routes (route_name, bus_number, driver_name, driver_phone, helper_name, helper_phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [routeName, busNumber || '', driverName || '', driverPhone || '', helperName || '', helperPhone || '']
    );
    return this.findRouteById(result.insertId);
  },

  async findAllRoutes() {
    const [routes] = await pool.query('SELECT * FROM transport_routes WHERE is_active = 1 ORDER BY route_name');
    const result = [];
    for (const route of routes) {
      const [stops] = await pool.query('SELECT * FROM transport_stops WHERE route_id = ? ORDER BY sort_order', [route.id]);
      const [students] = await pool.query(
        `SELECT st.*, s.name AS studentName, s.srv_number AS srvNumber, s.grade, s.section, ts.stop_name AS stopName
         FROM student_transport st
         JOIN students s ON st.student_id = s.id
         LEFT JOIN transport_stops ts ON st.stop_id = ts.id
         WHERE st.route_id = ?`,
        [route.id]
      );
      result.push({
        _id: route.id, routeName: route.route_name, busNumber: route.bus_number,
        driverName: route.driver_name, driverPhone: route.driver_phone,
        helperName: route.helper_name, helperPhone: route.helper_phone,
        isActive: Boolean(route.is_active),
        stops: stops.map(s => ({ _id: s.id, stopName: s.stop_name, pickupTime: s.pickup_time, dropTime: s.drop_time, sortOrder: s.sort_order })),
        students: students.map(s => ({ _id: s.id, studentId: s.student_id, studentName: s.studentName, srvNumber: s.srvNumber, grade: s.grade, section: s.section, stopName: s.stopName })),
        createdAt: route.created_at
      });
    }
    return result;
  },

  async findRouteById(id) {
    const [routes] = await pool.query('SELECT * FROM transport_routes WHERE id = ?', [id]);
    if (!routes[0]) return null;
    const route = routes[0];
    const [stops] = await pool.query('SELECT * FROM transport_stops WHERE route_id = ? ORDER BY sort_order', [id]);
    return {
      _id: route.id, routeName: route.route_name, busNumber: route.bus_number,
      driverName: route.driver_name, driverPhone: route.driver_phone,
      helperName: route.helper_name, helperPhone: route.helper_phone,
      stops: stops.map(s => ({ _id: s.id, stopName: s.stop_name, pickupTime: s.pickup_time, dropTime: s.drop_time, sortOrder: s.sort_order }))
    };
  },

  async updateRoute(id, data) {
    const fields = [];
    const params = [];
    if (data.routeName !== undefined) { fields.push('route_name = ?'); params.push(data.routeName); }
    if (data.busNumber !== undefined) { fields.push('bus_number = ?'); params.push(data.busNumber); }
    if (data.driverName !== undefined) { fields.push('driver_name = ?'); params.push(data.driverName); }
    if (data.driverPhone !== undefined) { fields.push('driver_phone = ?'); params.push(data.driverPhone); }
    if (data.helperName !== undefined) { fields.push('helper_name = ?'); params.push(data.helperName); }
    if (data.helperPhone !== undefined) { fields.push('helper_phone = ?'); params.push(data.helperPhone); }
    if (!fields.length) return this.findRouteById(id);
    params.push(id);
    await pool.query(`UPDATE transport_routes SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findRouteById(id);
  },

  async deleteRoute(id) {
    await pool.query('UPDATE transport_routes SET is_active = 0 WHERE id = ?', [id]);
  },

  // ── STOPS ──
  async setStops(routeId, stops = []) {
    await pool.query('DELETE FROM transport_stops WHERE route_id = ?', [routeId]);
    if (!stops.length) return;
    const values = stops.map((s, i) => [routeId, s.stopName, s.pickupTime || '', s.dropTime || '', s.sortOrder ?? i]);
    await pool.query('INSERT INTO transport_stops (route_id, stop_name, pickup_time, drop_time, sort_order) VALUES ?', [values]);
  },

  // ── STUDENT ASSIGNMENT ──
  async assignStudent(studentId, routeId, stopId) {
    await pool.query(
      `INSERT INTO student_transport (student_id, route_id, stop_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE route_id = VALUES(route_id), stop_id = VALUES(stop_id)`,
      [studentId, routeId, stopId || null]
    );
  },

  async removeStudent(studentId) {
    await pool.query('DELETE FROM student_transport WHERE student_id = ?', [studentId]);
  },

  async findByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT st.*, tr.route_name, tr.bus_number, tr.driver_name, tr.driver_phone, tr.helper_name, tr.helper_phone,
              ts.stop_name, ts.pickup_time, ts.drop_time
       FROM student_transport st
       JOIN transport_routes tr ON st.route_id = tr.id
       LEFT JOIN transport_stops ts ON st.stop_id = ts.id
       WHERE st.student_id = ?`,
      [studentId]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      routeName: r.route_name, busNumber: r.bus_number,
      driverName: r.driver_name, driverPhone: r.driver_phone,
      helperName: r.helper_name, helperPhone: r.helper_phone,
      stopName: r.stop_name, pickupTime: r.pickup_time, dropTime: r.drop_time
    };
  }
};

export default Transport;
