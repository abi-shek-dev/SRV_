import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import FoodMenu from '../models/FoodMenu.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Memory from '../models/Memory.js';
import HomeworkSubmission from '../models/HomeworkSubmission.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Circular from '../models/Circular.js';
import Transport from '../models/Transport.js';
import Library from '../models/Library.js';
import { protect } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';
import { buildHomeworkClassFilter } from '../utils/homeworkMatching.js';
import { hydratePolls } from '../utils/pollService.js';
import { buildClassAudienceFilter, validatePollAnswers } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { validateParticipantNames } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';
import { buildParentDisplayName } from '../utils/parentProfile.js';

const router = express.Router();

const parentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    next();
  } else {
    res.status(403).json({ message: 'Request forbidden: Parent access required' });
  }
};

const findHomeworkForStudent = async ({ student, extraQuery = {} }) => {
  const facultyId = student.facultyId?._id || student.facultyId;
  const classQuery = {
    ...buildHomeworkClassFilter({ grade: student.grade, section: student.section }),
    ...extraQuery
  };

  let homework = await Homework.find(classQuery);

  // Backward-compatible fallback
  if (homework.length === 0 && facultyId) {
    homework = await Homework.find({ facultyId, ...extraQuery });
  }

  return homework;
};

// @route   GET /api/parent/dashboard
router.get('/dashboard', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    archiveOldHomework().catch(() => {});

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[new Date().getDay()];

    const [records, homework, exactFood, regexFood, weeklyFood, feeSetting, academicYearSetting, classAttendance, classBehavior] =
      await Promise.all([
        AcademicRecord.find({ studentId: student._id }),
        findHomeworkForStudent({
          student,
          extraQuery: { archived: { $ne: true }, dueDate: { $gte: todayStart, $lte: todayEnd } }
        }),
        FoodMenu.findOne({ day: todayDayName }),
        FoodMenu.findDayByName(todayDayName),
        FoodMenu.find(),
        Setting.findOne({ key: 'onlineFeePayment' }),
        Setting.findOne({ key: 'academicYear' }),
        Attendance.find({ facultyId: student.facultyId?._id || student.facultyId }),
        Behavior.find({ facultyId: student.facultyId?._id || student.facultyId })
      ]);

    let food = exactFood || regexFood;
    if (!food) {
      food = weeklyFood.find(item => String(item.day || '').trim().toLowerCase() === todayDayName.toLowerCase()) || null;
    }

    const isOnlineFeeEnabled = feeSetting ? feeSetting.value : false;

    // Build current academic year label to filter attendance
    let currentAcademicYear = null;
    if (academicYearSetting?.value?.start && academicYearSetting?.value?.end) {
      currentAcademicYear = `${academicYearSetting.value.start} to ${academicYearSetting.value.end}`;
    }

    const attendanceFlat = classAttendance
      .filter(doc => !currentAcademicYear || doc.academicYear === currentAcademicYear)
      .flatMap(doc =>
        (doc.records || [])
          .filter(r => r.studentId && r.studentId.toString() === student._id.toString())
          .map(r => ({ date: doc.date, status: r.status, remarks: r.remarks, academicYear: doc.academicYear }))
    );

    const behaviorFlat = classBehavior.flatMap(doc =>
      (doc.records || [])
        .filter(r => r.studentId && r.studentId.toString() === student._id.toString() && r.score !== null)
        .map(r => ({ date: doc.date, score: r.score, remarks: r.remarks }))
    );

    res.set('Cache-Control', 'private, max-age=60');
    res.json({ student, records, homework, food, attendance: attendanceFlat, behavior: behaviorFlat, settings: { isOnlineFeeEnabled } });
  } catch (error) {
    console.error('[Parent Dashboard Error]', error);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

// @route   GET /api/parent/notifications
router.get('/notifications', protect, parentOnly, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   GET /api/parent/memories
router.get('/memories', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const studentId = parentUser.studentId;
    
    let memories;
    if (studentId) {
      memories = await Memory.find({ $or: [{ studentId: null }, { studentId }] });
    } else {
      memories = await Memory.find({ studentId: null });
    }
    
    res.json(memories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching memories' });
  }
});

// @route   GET /api/parent/homework/weekly
router.get('/homework/weekly', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await archiveOldHomework();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const homework = await findHomeworkForStudent({
      student,
      extraQuery: { archived: { $ne: true }, dueDate: { $gte: today, $lte: sixtyDaysFromNow } }
    });

    res.json(homework);
  } catch (error) {
    console.error('Error in /homework/weekly:', error.message, error);
    res.status(500).json({ message: 'Server error fetching homework' });
  }
});

// @route   GET /api/parent/homework/history/:subject
router.get('/homework/history/:subject', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const subject = decodeURIComponent(req.params.subject);
    const query = { subject };

    if (req.query.archived === 'true') query.archived = true;
    else if (req.query.archived === 'false') query.archived = false;

    const homework = await findHomeworkForStudent({ student, extraQuery: query });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching homework history' });
  }
});

// @route   POST /api/parent/homework/:homeworkId/submit
// @desc    Parent uploads a PDF submission for their child's homework
// @access  Private (Parent only)
router.post('/homework/:homeworkId/submit', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const hw = await Homework.findById(req.params.homeworkId);
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    // Check submission deadline
    if (hw.submissionDeadline) {
      const deadlineDate = new Date(hw.submissionDeadline);
      deadlineDate.setHours(23, 59, 59, 999);
      if (deadlineDate < new Date()) {
        return res.status(400).json({ message: 'Submission deadline has passed. You can no longer upload.' });
      }
    }

    // Body must be raw PDF buffer (Content-Type: application/pdf)
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: 'Please upload a valid PDF file (Content-Type: application/pdf)' });
    }

    const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB
    if (req.body.length > MAX_PDF_SIZE) {
      return res.status(413).json({ message: 'PDF is too large. Maximum allowed size is 15MB.' });
    }

    const filename = req.headers['x-filename'] || `homework_${student.name}_${Date.now()}.pdf`;

    const submission = await HomeworkSubmission.upsertSubmission({
      homeworkId: req.params.homeworkId,
      studentId: student._id,
      parentId: req.user.id,
      pdfData: req.body,
      pdfFilename: filename,
      pdfSize: req.body.length
    });

    res.status(201).json({
      message: 'Homework submitted successfully! It will be available for 7 days.',
      submission
    });
  } catch (error) {
    console.error('[Homework Submit Error]', error);
    res.status(500).json({ message: 'Error submitting homework' });
  }
});

// @route   GET /api/parent/homework/:homeworkId/submission
// @desc    Get the parent's child's submission status for a homework
// @access  Private (Parent only)
router.get('/homework/:homeworkId/submission', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });
    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const submission = await HomeworkSubmission.findOne({
      homeworkId: req.params.homeworkId,
      studentId: student._id
    });
    res.json(submission || null);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission' });
  }
});

// @route   GET /api/parent/homework/submissions/:submissionId/pdf
// @desc    Parent views their child's submitted PDF (only within 7-day window)
// @access  Private (Parent only)
router.get('/homework/submissions/:submissionId/pdf', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });
    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const row = await HomeworkSubmission.getPdf(req.params.submissionId);
    if (!row || !row.pdf_data) return res.status(404).json({ message: 'PDF not found or already expired' });

    // Verify this PDF belongs to the parent's child
    const sub = await HomeworkSubmission.findById(req.params.submissionId);
    if (!sub || String(sub.studentId) !== String(student._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(410).json({ message: 'PDF has expired and been deleted' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${row.pdf_filename || 'homework.pdf'}"`);
    res.send(row.pdf_data);
  } catch (error) {
    res.status(500).json({ message: 'Error serving PDF' });
  }
});


// @route   PUT /api/parent/notifications/:id/read
router.put('/notifications/:id/read', protect, parentOnly, async (req, res) => {
  try {
    await Notification.updateMany({ _id: req.params.id, userId: req.user.id }, { $set: { isRead: true } });
    const notification = await Notification.find({ userId: req.user.id }).then(ns => ns.find(n => String(n._id) === req.params.id));
    res.json(notification || { _id: req.params.id, isRead: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// @route   GET /api/parent/food
router.get('/food', protect, parentOnly, async (req, res) => {
  try {
    const menu = await FoodMenu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food menu' });
  }
});

// @route   POST /api/parent/pay-fee
router.post('/pay-fee', protect, parentOnly, async (req, res) => {
  const { term, amount, amountToPay } = req.body;
  try {
    const setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting || setting.value !== true) {
      return res.status(403).json({ message: 'Online fee payment is currently disabled.' });
    }

    const parentUser = await User.findById(req.user.id);
    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    if (!student.fees) student.fees = {};
    const paidVal = Number(amountToPay) || 0;
    const termPaidKey = `${term}Paid`;
    const termAmtKey = `${term}Amount`;

    student.fees[termPaidKey] = (Number(student.fees[termPaidKey]) || 0) + paidVal;
    const targetAmt = student.fees[termAmtKey] || 4500;
    if (student.fees[termPaidKey] >= targetAmt) student.fees[term] = 'Paid';
    else if (student.fees[termPaidKey] > 0) student.fees[term] = 'Partial';
    else student.fees[term] = 'Unpaid';

    await Student.save(student);

    const admins = await User.find({ role: 'admin' });
    const parentDisplayName = buildParentDisplayName(student, parentUser.name);
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'FEE_ALERT',
      message: `${parentDisplayName} paid ${amount} for ${student.name} (${student.srvNumber}) - ${term}`
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.json({ message: 'Payment successful', student });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// @route   GET /api/parent/debug/homework
router.get('/debug/homework', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const student = parentUser.studentId ? await Student.findById(parentUser.studentId) : null;

    const allHomework = student ? await findHomeworkForStudent({ student }) : [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const futureHomework = student ? await findHomeworkForStudent({
      student,
      extraQuery: { archived: { $ne: true }, dueDate: { $gte: today, $lte: sixtyDaysFromNow } }
    }) : [];

    res.json({
      parentId: parentUser._id,
      studentLinked: !!student,
      student: student ? { _id: student._id, name: student.name, grade: student.grade, section: student.section } : null,
      allHomeworkCount: allHomework.length,
      futureHomeworkCount: futureHomework.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// @route   GET /api/parent/announcements
router.get('/announcements', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // SQL-native: GLOBAL OR CLASS matching grade/section, not dismissed by this user
    const announcements = await Announcement.findForParent(req.user.id, student.grade, student.section);
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   POST /api/parent/announcements/:id/dismiss
router.post('/announcements/:id/dismiss', protect, parentOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await Announcement.dismiss(req.params.id, req.user.id);
    res.json({ message: 'Announcement dismissed' });
  } catch (error) {
    res.status(500).json({ message: 'Error dismissing announcement' });
  }
});

// @route   GET /api/parent/polls
router.get('/polls', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // SQL-native: active polls for parent's class
    const polls = await Poll.findForParent(student.grade, student.section);
    res.json(await hydratePolls(polls, { respondentId: req.user.id }));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   POST /api/parent/polls/:id/respond
router.post('/polls/:id/respond', protect, parentOnly, async (req, res) => {
  const { answers } = req.body;

  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // SQL-native: find active poll with id available to this parent
    const poll = await Poll.findOneForParent(req.params.id, student.grade, student.section);
    if (!poll) return res.status(404).json({ message: 'Poll not found or no longer active.' });

    const normalizedAnswers = validatePollAnswers(poll, answers);

    // Upsert poll response
    const response = await PollResponse.upsert(poll._id, req.user.id, {
      studentId: student._id,
      answers: normalizedAnswers,
      respondedAt: new Date()
    });

    res.json({ message: 'Poll response saved successfully.', response });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting poll response' });
  }
});

// @route   POST /api/parent/feedback
router.post('/feedback', protect, parentOnly, async (req, res) => {
  const { category, subject, message } = req.body;
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    if (!category || !subject || !message) {
      return res.status(400).json({ message: 'Category, subject, and message are required.' });
    }

    const feedback = await Feedback.create({
      parentId: req.user.id,
      studentId: student._id,
      facultyId: student.facultyId || undefined,
      studentName: student.name,
      grade: String(student.grade),
      section: String(student.section),
      category,
      subject: String(subject).trim(),
      message: String(message).trim()
    });

    res.status(201).json({ message: 'Feedback submitted successfully.', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting feedback' });
  }
});

// @route   GET /api/parent/feedback
router.get('/feedback', protect, parentOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find({ parentId: req.user.id });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   GET /api/parent/events
router.get('/events', protect, parentOnly, async (req, res) => {
  try {
    await archivePastEvents();
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // SQL-native: GLOBAL + CLASS events, not expired, published
    const events = await Event.findForParent(student.grade, student.section);
    res.json(await hydrateEvents(events, { respondentId: req.user.id }));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   POST /api/parent/events/:id/register
router.post('/events/:id/register', protect, parentOnly, async (req, res) => {
  const { participantNames, note } = req.body;

  try {
    await archivePastEvents();
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // Verify the event is accessible to this parent
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'ACTIVE' || !event.isPublished) {
      return res.status(404).json({ message: 'Event not found or no longer active.' });
    }

    const normalizedNames = validateParticipantNames(participantNames);

    // Upsert event registration
    const registration = await EventRegistration.upsert(event._id, req.user.id, {
      studentId: student._id,
      facultyId: student.facultyId || null,
      participantNames: normalizedNames,
      note: String(note || '').trim(),
      acknowledgedAt: new Date()
    });

    res.json({ message: 'Event acknowledgement saved successfully.', registration });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving event acknowledgement' });
  }
});

// @route   POST /api/parent/leave
router.post('/leave', protect, parentOnly, async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    if (!startDate || !endDate) return res.status(400).json({ message: 'Start and end dates are required.' });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ message: 'End date must be after start date.' });

    const leave = await LeaveRequest.create({
      studentId: parentUser.studentId,
      parentId: req.user.id,
      leaveType: leaveType || 'OTHER',
      startDate, endDate,
      reason: String(reason || '').trim()
    });

    res.status(201).json({ message: 'Leave request submitted.', leave });
  } catch (error) {
    console.error('[Leave Request Error]', error);
    res.status(500).json({ message: 'Error submitting leave request' });
  }
});

// @route   GET /api/parent/leave
router.get('/leave', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const leaves = await LeaveRequest.findByStudent(parentUser.studentId);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// @route   GET /api/parent/report-card
router.get('/report-card', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser?.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Get all academic records for this student
    const records = await AcademicRecord.find({ studentId: student._id });

    // Get attendance summary
    const allLogs = await Attendance.find();
    let totalDays = 0, presentDays = 0;
    allLogs.forEach(log => {
      (log.records || []).forEach(r => {
        if (String(r.studentId) === String(student._id)) {
          totalDays++;
          if (r.status === 'Present') presentDays++;
        }
      });
    });

    // Get behavior average
    const behaviorLogs = await Behavior.find();
    let behaviorSum = 0, behaviorCount = 0;
    behaviorLogs.forEach(log => {
      (log.records || []).forEach(r => {
        if (String(r.studentId) === String(student._id) && r.score != null) {
          behaviorSum += r.score;
          behaviorCount++;
        }
      });
    });

    res.json({
      student: {
        name: student.name,
        srvNumber: student.srvNumber,
        grade: student.grade,
        section: student.section,
        dateOfBirth: student.dateOfBirth,
        fatherName: student.fatherName,
        motherName: student.motherName
      },
      academics: records,
      attendance: {
        totalDays,
        presentDays,
        percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      },
      behavior: {
        average: behaviorCount > 0 ? Math.round((behaviorSum / behaviorCount) * 10) / 10 : 0,
        totalEntries: behaviorCount
      }
    });
  } catch (error) {
    console.error('[Report Card Error]', error);
    res.status(500).json({ message: 'Error generating report card data' });
  }
});

// ══════════════════════════════════════════════════
// CIRCULARS
// ══════════════════════════════════════════════════
router.get('/circulars', protect, parentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ parentUserId: req.user.id });
    const filters = student ? { targetGrade: student.grade, targetSection: student.section } : {};
    const circulars = await Circular.findAll(filters);
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching circulars' });
  }
});

// ══════════════════════════════════════════════════
// TRANSPORT INFO
// ══════════════════════════════════════════════════
router.get('/transport', protect, parentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ parentUserId: req.user.id });
    if (!student) return res.json(null);
    const transport = await Transport.findByStudent(student._id);
    res.json(transport);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transport info' });
  }
});

// ══════════════════════════════════════════════════
// LIBRARY — My Books
// ══════════════════════════════════════════════════
router.get('/library', protect, parentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ parentUserId: req.user.id });
    if (!student) return res.json([]);
    const issues = await Library.findByStudent(student._id);
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching library info' });
  }
});

// ══════════════════════════════════════════════════
// TEACHER WHATSAPP & CONTACT
// ══════════════════════════════════════════════════
router.get('/teacher-contact', protect, parentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ parentUserId: req.user.id });
    if (!student) return res.json(null);
    // Find class teacher (faculty assigned to this grade+section)
    const pool = (await import('../db/pool.js')).default;
    const [rows] = await pool.query(
      `SELECT name, whatsapp_link, contact_number, assigned_grade, assigned_section FROM users WHERE role = 'faculty' AND assigned_grade = ? AND assigned_section = ? LIMIT 1`,
      [student.grade, student.section]
    );
    if (!rows[0]) return res.json(null);
    const t = rows[0];
    res.json({ teacherName: t.name, whatsappLink: t.whatsapp_link || '', contactNumber: t.contact_number || '', grade: t.assigned_grade, section: t.assigned_section });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher contact' });
  }
});

export default router;
