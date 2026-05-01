/**
 * Push Notification Service
 * Handles: In-app DB notifications + Expo Push Notifications for mobile
 */
import pool from '../db/pool.js';
import Notification from '../models/Notification.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send Expo push notification to specific tokens
 */
async function sendExpoPush(tokens, { title, body, data = {} }) {
  if (!tokens.length) return;
  const messages = tokens
    .filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken'))
    .map(token => ({ to: token, sound: 'default', title, body, data }));

  if (!messages.length) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await res.json();
    console.log(`[Push] Sent ${messages.length} notification(s)`);
    return result;
  } catch (err) {
    console.error('[Push Error]', err.message);
  }
}

/**
 * Get expo push tokens for given user IDs
 */
async function getTokensForUsers(userIds = []) {
  if (!userIds.length) return [];
  const placeholders = userIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT expo_push_token FROM users WHERE id IN (${placeholders}) AND expo_push_token IS NOT NULL AND expo_push_token != ''`,
    userIds
  );
  return rows.map(r => r.expo_push_token);
}

/**
 * Get parent user IDs for a student
 */
async function getParentIdsForStudent(studentId) {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE role = 'parent' AND student_id = ?`,
    [studentId]
  );
  return rows.map(r => r.id);
}

/**
 * Get parent user IDs for a class (grade + section)
 */
async function getParentIdsForClass(grade, section) {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u JOIN students s ON u.student_id = s.id WHERE u.role = 'parent' AND s.grade = ? AND s.section = ?`,
    [grade, section]
  );
  return rows.map(r => r.id);
}

// ════════════════════════════════════════════════
// NOTIFICATION TRIGGERS
// ════════════════════════════════════════════════

/**
 * Notify parents when their child is marked Absent
 */
export async function notifyAttendanceAbsent(studentId, studentName, date) {
  const parentIds = await getParentIdsForStudent(studentId);
  if (!parentIds.length) return;

  const message = `${studentName} was marked Absent on ${new Date(date).toLocaleDateString()}`;

  // Save DB notifications
  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'ATTENDANCE_ALERT', message }))
  );

  // Send push
  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: '⚠️ Attendance Alert', body: message, data: { type: 'attendance' } });
}

/**
 * Notify class parents when new homework is assigned
 */
export async function notifyHomeworkAssigned(grade, section, subject, title) {
  const parentIds = await getParentIdsForClass(grade, section);
  if (!parentIds.length) return;

  const message = `New ${subject} homework: "${title}" assigned to ${grade}-${section}`;

  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'HOMEWORK_ISSUED', message }))
  );

  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: '📚 New Homework', body: message, data: { type: 'homework' } });
}

/**
 * Notify parent when leave request status changes
 */
export async function notifyLeaveStatusChanged(studentId, studentName, status) {
  const parentIds = await getParentIdsForStudent(studentId);
  if (!parentIds.length) return;

  const emoji = status === 'APPROVED' ? '✅' : '❌';
  const message = `Leave request for ${studentName} has been ${status.toLowerCase()}`;

  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'GENERAL', message }))
  );

  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: `${emoji} Leave ${status}`, body: message, data: { type: 'leave' } });
}

/**
 * Notify parent when marks are updated
 */
export async function notifyMarksUpdated(studentId, studentName, term) {
  const parentIds = await getParentIdsForStudent(studentId);
  if (!parentIds.length) return;

  const message = `${studentName}'s marks for ${term} have been updated`;

  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'MARKS_UPDATED', message }))
  );

  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: '📝 Marks Updated', body: message, data: { type: 'marks' } });
}

/**
 * Notify parents when fee payment is recorded
 */
export async function notifyFeePayment(studentId, studentName, term, amount) {
  const parentIds = await getParentIdsForStudent(studentId);
  if (!parentIds.length) return;

  const message = `Fee payment of ₹${amount} recorded for ${studentName} (${term})`;

  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'FEE_ALERT', message }))
  );

  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: '💰 Fee Payment Recorded', body: message, data: { type: 'fee' } });
}

/**
 * Notify class parents about a new announcement
 */
export async function notifyAnnouncement(title, targetGrade, targetSection) {
  let parentIds;
  if (targetGrade && targetSection) {
    parentIds = await getParentIdsForClass(targetGrade, targetSection);
  } else {
    // Global announcement — notify all parents
    const [rows] = await pool.query(`SELECT id FROM users WHERE role = 'parent'`);
    parentIds = rows.map(r => r.id);
  }
  if (!parentIds.length) return;

  const message = `New announcement: "${title}"`;

  await Notification.insertMany(
    parentIds.map(pid => ({ userId: pid, type: 'GENERAL', message }))
  );

  const tokens = await getTokensForUsers(parentIds);
  await sendExpoPush(tokens, { title: '📢 New Announcement', body: message, data: { type: 'announcement' } });
}

/**
 * Notify specific faculty members about a new task
 */
export async function notifyTaskAssigned(facultyIds, taskTitle) {
  if (!facultyIds.length) return;

  const message = `New task assigned: "${taskTitle}"`;

  await Notification.insertMany(
    facultyIds.map(fid => ({ userId: fid, type: 'GENERAL', message }))
  );

  const tokens = await getTokensForUsers(facultyIds);
  await sendExpoPush(tokens, { title: '📋 New Task', body: message, data: { type: 'task' } });
}

/**
 * Save/update expo push token for a user
 */
export async function savePushToken(userId, token) {
  await pool.query('UPDATE users SET expo_push_token = ? WHERE id = ?', [token, userId]);
}

/**
 * Remove push token on logout
 */
export async function removePushToken(userId) {
  await pool.query('UPDATE users SET expo_push_token = NULL WHERE id = ?', [userId]);
}

export default {
  notifyAttendanceAbsent,
  notifyHomeworkAssigned,
  notifyLeaveStatusChanged,
  notifyMarksUpdated,
  notifyFeePayment,
  notifyAnnouncement,
  notifyTaskAssigned,
  savePushToken,
  removePushToken,
};
