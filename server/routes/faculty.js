import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Memory from '../models/Memory.js';
import Setting from '../models/Setting.js';
import HomeworkSubmission from '../models/HomeworkSubmission.js';
import LeaveRequest from '../models/LeaveRequest.js';
import FacultyLeaveRequest from '../models/FacultyLeaveRequest.js';
import Circular from '../models/Circular.js';
import Transport from '../models/Transport.js';
import Library from '../models/Library.js';
import FoodMenu from '../models/FoodMenu.js';
import { notifyAttendanceAbsent, notifyHomeworkAssigned, notifyLeaveStatusChanged } from '../services/pushNotification.js';
import { protect, facultyOrAdmin } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';
import { buildHomeworkClassFilter, resolveHomeworkAudience } from '../utils/homeworkMatching.js';
import { hydratePolls } from '../utils/pollService.js';
import { buildClassAudienceFilter, normalizeClassValue, validateAndNormalizeQuestions } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { normalizeEventPayload } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';
import { applyStudentFamilyDetails, validateStudentFamilyDetails } from '../utils/studentFamilyDetails.js';
import { buildParentDisplayName, enrichParentLinkedRecord, enrichParentLinkedRecords } from '../utils/parentProfile.js';
import { normalizeParentMobileNumber, syncParentAccountDetails } from '../utils/parentContact.js';
import {
  buildCloudinaryUploadConfig,
  buildCloudinaryUploadSignature,
  getCloudinaryGalleryFolder
} from '../utils/cloudinary.js';

const router = express.Router();

const getFacultyClassContext = async (facultyId) => {
  const faculty = await User.findById(facultyId);
  let assignedGrade = faculty?.assignedGrade;
  let assignedSection = faculty?.assignedSection;

  if ((!assignedGrade || !assignedSection) && facultyId) {
    const firstStudent = await Student.findOne({ facultyId });
    assignedGrade = assignedGrade || firstStudent?.grade;
    assignedSection = assignedSection || firstStudent?.section;
  }

  if (!assignedGrade || !assignedSection) {
    return null;
  }

  return {
    assignedGrade: normalizeClassValue(assignedGrade),
    assignedSection: normalizeClassValue(assignedSection)
  };
};

// @route   GET /api/faculty/students
// @desc    Get all students assigned to this faculty
// @access  Private (Faculty/Admin)
router.get('/students', protect, facultyOrAdmin, async (req, res) => {
  try {
    // If Admin, they see all mapped. If Faculty, only theirs.
    const query = req.user.role === 'admin' ? {} : { facultyId: req.user.id };
    const students = await Student.find(query);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @route   PUT /api/faculty/student/:id
// @desc    Update a student profile from the faculty dashboard
// @access  Private (Faculty/Admin)
router.put('/student/:id', protect, facultyOrAdmin, async (req, res) => {
  const { name, grade, section, group } = req.body;

  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, facultyId: req.user.id };

    const student = await Student.findOne(query);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const familyValidation = validateStudentFamilyDetails({
      motherName: student.motherName,
      fatherName: student.fatherName,
      guardianName: student.guardianName,
      ...req.body
    });
    if (!familyValidation.isValid) {
      return res.status(400).json({ message: familyValidation.message });
    }

    if (name !== undefined) student.name = name;
    if (grade !== undefined) student.grade = grade;
    if (section !== undefined) student.section = section;
    if (group !== undefined) student.group = group;
    if (req.body.dateOfBirth !== undefined) {
      // Pass raw yyyy-mm-dd string to MySQL to avoid timezone shifts
      student.dateOfBirth = req.body.dateOfBirth ? String(req.body.dateOfBirth).split('T')[0] : null;
    }
    if (req.body.parentMobileNumber !== undefined) {
      student.parentMobileNumber = normalizeParentMobileNumber(req.body.parentMobileNumber);
    }
    applyStudentFamilyDetails(student, familyValidation.familyDetails);

    await Student.save(student);
    await syncParentAccountDetails(student, `Parent of ${student.name}`);

    res.json({ message: 'Student profile updated successfully', student });
  } catch (error) {
    console.error('[Faculty Edit Student Error]', error.message || error);
    res.status(500).json({ message: error.message || 'Error updating student profile' });
  }
});

// @route   GET /api/faculty/memories
// @desc    Get school memories for faculty download/view access
// @access  Private (Faculty/Admin)
router.get('/memories', protect, facultyOrAdmin, async (req, res) => {
  try {
    const memories = await Memory.find();
    res.json(memories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memories' });
  }
});

// @route   GET /api/faculty/memories/upload-config
// @desc    Get Cloudinary upload configuration for direct browser uploads
// @access  Private (Faculty only)
router.get('/memories/upload-config', protect, facultyOrAdmin, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadConfig({
      folder: getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error loading upload configuration' });
  }
});

// @route   POST /api/faculty/memories/upload-signature
// @desc    Create signed Cloudinary upload params for browser uploads
// @access  Private (Faculty only)
router.post('/memories/upload-signature', protect, facultyOrAdmin, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadSignature({
      folder: req.body?.folder || getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create upload signature.' });
  }
});

// @route   POST /api/faculty/memories
// @desc    Save uploaded memory metadata specifically for a student
// @access  Private (Faculty only)
router.post('/memories', protect, facultyOrAdmin, async (req, res) => {
  const {
    title,
    description,
    secureUrl,
    publicId,
    resourceType,
    bytes,
    format,
    originalFilename,
    folder,
    studentId
  } = req.body;

  try {
    const normalizedResourceType = String(resourceType || '').trim().toLowerCase();
    const normalizedTitle = String(title || originalFilename || 'School Memory').trim();

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Memory title is required.' });
    }

    if (!secureUrl) {
      return res.status(400).json({ message: 'Uploaded media URL is required.' });
    }

    if (!['image', 'video'].includes(normalizedResourceType)) {
      return res.status(400).json({ message: 'Only images and videos are supported.' });
    }

    const fileBytes = Number(bytes) || 0;
    if (normalizedResourceType === 'image' && fileBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Photo uploads must be under 5 MB.' });
    }

    const memory = await Memory.create({
      title: normalizedTitle,
      description: String(description || '').trim(),
      secureUrl: String(secureUrl).trim(),
      publicId: String(publicId || '').trim(),
      resourceType: normalizedResourceType,
      bytes: fileBytes,
      format: String(format || '').trim(),
      originalFilename: String(originalFilename || '').trim(),
      folder: String(folder || '').trim(),
      uploadedBy: req.user.id,
      createdByRole: 'faculty',
      studentId: studentId
    });

    res.status(201).json({ message: 'Memory saved successfully.', memory });
  } catch (error) {
    res.status(500).json({ message: 'Error saving memory.' });
  }
});

// @route   GET /api/faculty/marks/:studentId
// @desc    Get academic records for a specific student
// @access  Private (Faculty/Admin)
router.get('/marks/:studentId', protect, facultyOrAdmin, async (req, res) => {
  try {
    const records = await AcademicRecord.find({ studentId: req.params.studentId });
    // Flatten marks into array format the mobile app expects
    const flat = [];
    records.forEach(rec => {
      if (rec.marks) {
        Object.entries(rec.marks).forEach(([subject, score]) => {
          if (score > 0) flat.push({ subject, score, maxScore: 100, term: rec.term });
        });
      }
    });
    res.json(flat);
  } catch (error) {
    console.error('[Marks Fetch Error]', error.message);
    res.status(500).json({ message: 'Error fetching marks' });
  }
});

// @route   GET /api/faculty/behavior/:studentId
// @desc    Get behavior logs for a specific student
// @access  Private (Faculty/Admin)
router.get('/behavior/:studentId', protect, facultyOrAdmin, async (req, res) => {
  try {
    const allBehavior = await Behavior.find({ facultyId: req.user.id });
    const studentLogs = allBehavior.flatMap(doc =>
      (doc.records || [])
        .filter(r => r.studentId && r.studentId.toString() === req.params.studentId)
        .map(r => ({ date: doc.date, score: r.score, remarks: r.remarks }))
    );
    res.json(studentLogs);
  } catch (error) {
    console.error('[Behavior Fetch Error]', error.message);
    res.status(500).json({ message: 'Error fetching behavior' });
  }
});

// @route   POST /api/faculty/marks
// @desc    Add or Update academic records (Marks, Attendance, Behaviour)
// @access  Private (Faculty/Admin)
router.post('/marks', protect, facultyOrAdmin, async (req, res) => {
  const { studentId, term, marks, totalWorkingDays, daysPresent, performanceRemarks, behaviour, extraActivities, ecSkills } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let record = await AcademicRecord.findOne({ studentId, term });

    if (record) {
      // Update existing
      record.marks = { ...record.marks, ...marks };
      if (totalWorkingDays) record.totalWorkingDays = totalWorkingDays;
      if (daysPresent) record.daysPresent = daysPresent;
      if (performanceRemarks) record.performanceRemarks = performanceRemarks;
      if (behaviour) record.behaviour = behaviour;
      if (extraActivities) record.extraActivities = extraActivities;
      if (ecSkills) record.ecSkills = { ...record.ecSkills, ...ecSkills };
      
      record = await AcademicRecord.save(record);
    } else {
      // Create new
      record = await AcademicRecord.create({
        studentId,
        facultyId: req.user.id,
        term,
        marks,
        totalWorkingDays,
        daysPresent,
        performanceRemarks,
        behaviour,
        extraActivities,
        ecSkills
      });
    }

    // --- NOTIFICATIONS ---
    // Check if attendance is below 75%
    if (Number(record.attendancePercentage) < 75 && record.totalWorkingDays > 0) {
      // Find parent user
      const parentUser = await User.findOne({ student_id: studentId });
      if (parentUser) {
        await Notification.create({
          userId: parentUser._id,
          type: 'ATTENDANCE_ALERT',
          message: `Alert: ${student.name}'s attendance has fallen below 75% (${record.attendancePercentage}%). Please meet the faculty.`
        });
      }
    }

    // Notify of marks updated
    const parentUser = await User.findOne({ student_id: studentId });
    if (parentUser) {
      await Notification.create({
        userId: parentUser._id,
        type: 'MARKS_UPDATED',
        message: `New marks for ${term} have been updated for ${student.name}.`
      });
    }

    res.status(200).json({ message: 'Academic record saved successfully', record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving marks' });
  }
});

// @route   POST /api/faculty/homework
// @desc    Upload Homework
// @access  Private (Faculty/Admin)
router.post('/homework', protect, facultyOrAdmin, async (req, res) => {
  const { grade, section, subject, title, description, dueDate, submissionDeadline } = req.body;

  try {
    const faculty = req.user.role === 'faculty'
      ? await User.findById(req.user.id)
      : null;

    const audience = resolveHomeworkAudience({
      grade,
      section,
      assignedGrade: faculty?.assignedGrade,
      assignedSection: faculty?.assignedSection
    });

    if (!audience) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin and try again.' });
    }

    const homework = await Homework.create({
      facultyId: req.user.id,
      grade: audience.grade,
      section: audience.section,
      subject,
      title,
      description,
      dueDate,
      assignedDate: new Date(),
      archived: false,
      submissionDeadline
    });

    // Notify all parents of students in this grade and section
    const students = await Student.find(buildHomeworkClassFilter(audience));
    const studentIds = students.map(s => s._id);
    const parents = await User.findParentsForStudents(studentIds);
    
    const notifications = parents.map(p => ({
      userId: p._id,
      type: 'HOMEWORK_ISSUED',
      message: `New Homework: ${subject} - ${title}. Due: ${new Date(dueDate).toLocaleDateString()}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: 'Homework added successfully', homework });

    // Push notification (fire-and-forget)
    notifyHomeworkAssigned(audience.grade, audience.section, subject, title).catch(() => {});
  } catch (error) {
    console.error('[HOMEWORK CREATE ERROR]', error);
    res.status(500).json({ message: 'Server error adding homework' });
  }
});

// @route   GET /api/faculty/homework
// @desc    Get active (non-archived) homework assigned by faculty (last 14 days)
// @access  Private (Faculty/Admin)
router.get('/homework', protect, facultyOrAdmin, async (req, res) => {
  try {
    // Run auto-archive transparently
    await archiveOldHomework();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const query = req.user.role === 'admin' 
        ? { archived: { $ne: true }, createdAt: { $gte: fourteenDaysAgo } } 
        : { facultyId: req.user.id, archived: { $ne: true }, createdAt: { $gte: fourteenDaysAgo } };
        
    const homeworkList = await Homework.find(query);
    res.json(homeworkList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homework' });
  }
});

// @route   GET /api/faculty/homework/history/:subject
// @desc    Get all historical homework (active + archived) for a specific subject
// @access  Private (Faculty/Admin)
router.get('/homework/history/:subject', protect, facultyOrAdmin, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const query = req.user.role === 'admin' 
        ? { subject } 
        : { facultyId: req.user.id, subject };
    
    // Optional: filter by archived status via query param
    if (req.query.archived === 'true') {
      query.archived = true;
    } else if (req.query.archived === 'false') {
      query.archived = false;
    }
        
    const homeworkList = await Homework.find(query);
    res.json(homeworkList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homework history' });
  }
});

// @route   PUT /api/faculty/homework/:id
// @desc    Update/Edit existing homework (including deadline)
// @access  Private (Faculty/Admin)
router.put('/homework/:id', protect, facultyOrAdmin, async (req, res) => {
  const { subject, title, description, dueDate, submissionDeadline } = req.body;
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, facultyId: req.user.id };
    const hw = await Homework.findOneAndUpdate(
      query,
      { subject, title, description, dueDate, submissionDeadline },
      { new: true, runValidators: true }
    );
    if (!hw) return res.status(404).json({ message: 'Homework not found or unauthorized' });
    res.json({ message: 'Homework updated successfully', homework: hw });
  } catch (error) {
    res.status(500).json({ message: 'Error updating homework' });
  }
});

// @route   DELETE /api/faculty/homework/:id
// @desc    Soft-delete (archive) a homework assignment — no permanent deletion
// @access  Private (Faculty/Admin)
router.delete('/homework/:id', protect, facultyOrAdmin, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, facultyId: req.user.id };
    const hw = await Homework.findOneAndUpdate(
      query,
      { $set: { archived: true } },
      { new: true }
    );
    if (!hw) return res.status(404).json({ message: 'Homework not found or unauthorized' });
    res.json({ message: 'Homework archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error archiving homework' });
  }
});

// @route   POST /api/faculty/homework/:id/update-deadline
// @desc    Update submission_deadline on existing homework
// @access  Private (Faculty/Admin)
router.post('/homework/:id/update-deadline', protect, facultyOrAdmin, async (req, res) => {
  const { submissionDeadline } = req.body;
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, facultyId: req.user.id };
    const hw = await Homework.findOneAndUpdate(query, { submissionDeadline }, { new: true });
    if (!hw) return res.status(404).json({ message: 'Homework not found or unauthorized' });
    res.json({ message: 'Deadline updated', homework: hw });
  } catch (error) {
    res.status(500).json({ message: 'Error updating deadline' });
  }
});

// @route   GET /api/faculty/homework/:id/submissions
// @desc    Get all student submissions for a homework, including students with no submission
// @access  Private (Faculty/Admin)
router.get('/homework/:id/submissions', protect, facultyOrAdmin, async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    // Verify faculty owns this homework (admin can see all)
    if (req.user.role !== 'admin' && String(hw.facultyId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all students in this class
    const students = await Student.find(buildHomeworkClassFilter({ grade: hw.grade, section: hw.section }));
    // Get all submissions for this homework
    const submissions = await HomeworkSubmission.find({ homeworkId: req.params.id });
    const subMap = {};
    submissions.forEach(s => { subMap[String(s.studentId)] = s; });

    // Merge: every student gets a row
    const result = students.map(st => ({
      student: { _id: st._id, name: st.name, srvNumber: st.srvNumber, grade: st.grade, section: st.section },
      submission: subMap[String(st._id)] || null
    }));

    res.json({ homework: hw, students: result });
  } catch (error) {
    console.error('[Submissions fetch error]', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// @route   GET /api/faculty/homework/submissions/:submissionId/pdf
// @desc    Stream a submitted PDF (only within 7-day window)
// @access  Private (Faculty/Admin)
router.get('/homework/submissions/:submissionId/pdf', protect, facultyOrAdmin, async (req, res) => {
  try {
    const row = await HomeworkSubmission.getPdf(req.params.submissionId);
    if (!row || !row.pdf_data) return res.status(404).json({ message: 'PDF not found or already expired' });
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

// @route   PUT /api/faculty/homework/:homeworkId/submissions/:studentId/grade
// @desc    Grade a student's homework (with or without PDF upload)
// @access  Private (Faculty/Admin)
router.put('/homework/:homeworkId/submissions/:studentId/grade', protect, facultyOrAdmin, async (req, res) => {
  const { score, remarks } = req.body;
  try {
    if (score === undefined || score === null || score === '') {
      return res.status(400).json({ message: 'Score is required' });
    }
    const hw = await Homework.findById(req.params.homeworkId);
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    if (req.user.role !== 'admin' && String(hw.facultyId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const submission = await HomeworkSubmission.grade({
      homeworkId: req.params.homeworkId,
      studentId: req.params.studentId,
      score: Number(score),
      remarks,
      gradedBy: req.user.id
    });
    res.json({ message: 'Graded successfully', submission });
  } catch (error) {
    console.error('[Grade error]', error);
    res.status(500).json({ message: 'Error saving grade' });
  }
});

// @route   POST /api/faculty/homework/cleanup
// @desc    Manually trigger cleanup of expired PDFs
// @access  Private (Admin only)
router.post('/homework/cleanup', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const count = await HomeworkSubmission.cleanupExpiredPdfs();
    res.json({ message: `Cleaned up ${count} expired PDF(s)` });
  } catch (error) {
    res.status(500).json({ message: 'Cleanup error' });
  }
});

// @route   GET /api/faculty/attendance/:date
// @desc    Get attendance for a specific date
// @access  Private (Faculty/Admin)
router.get('/attendance/:date', protect, facultyOrAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    let dateStr = date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [dd, mm, yyyy] = date.split('-');
      dateStr = `${yyyy}-${mm}-${dd}`;
    }
    
    const attendanceDoc = await Attendance.findOne({
      facultyId: req.user.id,
      date: dateStr
    });
    
    if (!attendanceDoc) {
      return res.status(200).json({ notMarked: true, records: [] });
    }
    
    res.json(attendanceDoc);
  } catch (error) {
    console.error('[ATTENDANCE FETCH ERROR]', error.message);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

// @route   POST /api/faculty/attendance
// @desc    Submit daily or weekly attendance for the class
// @access  Private (Faculty/Admin)
router.post('/attendance', protect, facultyOrAdmin, async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records) return res.status(400).json({ message: 'Date and records are required.' });

  try {
    // Normalize date — portal sends DD-MM-YYYY, API/mobile sends YYYY-MM-DD
    let dateStr = date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [dd, mm, yyyy] = date.split('-');
      dateStr = `${yyyy}-${mm}-${dd}`; // Convert to YYYY-MM-DD
    }
    // Pass date as plain string to avoid UTC timezone shifts (do NOT use new Date())

    let setting = await Setting.findOne({ key: 'academicYear' });
    let academicYearStr = null;
    if (setting && setting.value && setting.value.start && setting.value.end) {
      academicYearStr = `${setting.value.start} to ${setting.value.end}`;
    }

    let attendanceDoc = await Attendance.findOne({
      facultyId: req.user.id,
      date: dateStr   // plain string — MySQL DATE column handles YYYY-MM-DD directly
    });

    if (attendanceDoc) {
      attendanceDoc.records = records;
      attendanceDoc.academicYear = academicYearStr;
      attendanceDoc = await Attendance.save(attendanceDoc);
    } else {
      let gradeStr = req.user.assignedGrade;
      let sectionStr = req.user.assignedSection;

      if ((!gradeStr || !sectionStr) && records.length > 0) {
        const firstStudent = await Student.findById(records[0].studentId);
        if (firstStudent) {
          gradeStr = firstStudent.grade;
          sectionStr = firstStudent.section;
        }
      }

      attendanceDoc = await Attendance.create({
        facultyId: req.user.id,
        grade: gradeStr || 'N/A',
        section: sectionStr || 'N/A',
        date: dateStr,   // plain YYYY-MM-DD string
        academicYear: academicYearStr,
        records
      });
    }

    res.json({ message: 'Attendance recorded for ' + dateStr, attendanceDoc });

    // Push notifications for absent students (fire-and-forget)
    try {
      const absentRecords = (records || []).filter(r => r.status === 'Absent');
      for (const rec of absentRecords) {
        const stu = await Student.findById(rec.studentId);
        if (stu) notifyAttendanceAbsent(stu._id, stu.name, dateStr).catch(() => {});
      }
    } catch (_) { /* non-blocking */ }
  } catch (error) {
    console.error('[ATTENDANCE ERROR]', error.message);
    // Handle duplicate entry — record exists with slightly different date (old timezone bug)
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(409).json({ message: 'Attendance for this date already exists. Try a different date or contact admin to reset it.' });
    }
    res.status(500).json({ message: 'Error saving attendance: ' + error.message });
  }
});

// @route   POST /api/faculty/behavior
// @desc    Submit daily behavior scores for the class
// @access  Private (Faculty/Admin)
router.post('/behavior', protect, facultyOrAdmin, async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records) return res.status(400).json({ message: 'Date and records are required.' });

  try {
    const parsedDate = new Date(date).setHours(0, 0, 0, 0);

    let behaviorDoc = await Behavior.findOne({ 
      facultyId: req.user.id, 
      date: new Date(parsedDate) 
    });

    if (behaviorDoc) {
      behaviorDoc.records = records;
      behaviorDoc = await Behavior.save(behaviorDoc);
    } else {
      let gradeStr = req.user.assignedGrade;
      let sectionStr = req.user.assignedSection;
      
      if ((!gradeStr || !sectionStr) && records.length > 0) {
        const Student = (await import('../models/Student.js')).default;
        const firstStudent = await Student.findById(records[0].studentId);
        if (firstStudent) {
            gradeStr = firstStudent.grade;
            sectionStr = firstStudent.section;
        }
      }
      
      behaviorDoc = await Behavior.create({
        facultyId: req.user.id,
        grade: gradeStr || 'N/A',
        section: sectionStr || 'N/A',
        date: new Date(parsedDate),
        records
      });
    }

    res.json({ message: 'Behavior logs saved for ' + new Date(parsedDate).toLocaleDateString(), behaviorDoc });
  } catch (error) {
    res.status(500).json({ message: 'Error saving behavior logs' });
  }
});

// @route   POST /api/faculty/announcements
// @desc    Create an announcement for faculty's students
// @access  Private (Faculty only)
router.post('/announcements', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create announcements' });
  }

  const { title, message, priority, toAllStudents, selectedStudentIds } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let recipients = [];
    
    if (toAllStudents) {
      // Send to all students in faculty's grade/section
      const students = await Student.find({
        grade: req.user.assignedGrade,
        section: req.user.assignedSection
      });
      
      // Get parent users for these students
      const studentParents = await User.findParentsForStudents(students.map(s => s._id));
      recipients = studentParents.map(r => r._id);
    } else if (selectedStudentIds && selectedStudentIds.length > 0) {
      // Send to manually selected students
      const selectedParents = await User.findParentsForStudents(selectedStudentIds);
      recipients = selectedParents.map(r => r._id);
    } else {
      return res.status(400).json({ message: 'No recipients selected' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'MEDIUM',
      type: 'CLASS',
      targetGrade: req.user.assignedGrade,
      targetSection: req.user.assignedSection,
      recipients,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      isPublished: true
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

// @route   GET /api/faculty/announcements
// @desc    Get all announcements created by this faculty
// @access  Private (Faculty only)
router.get('/announcements', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view their announcements' });
  }

  try {
    const announcements = await Announcement.find({ createdBy: req.user.id });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   GET /api/faculty/announcements/inbox
// @desc    Get all announcements targeted to this faculty (from admin) excluding dismissed
// @access  Private (Faculty only)
router.get('/announcements/inbox/all', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view their announcements' });
  }

  try {
    // Use SQL-native findForFaculty (handles $or logic in SQL)
    const announcements = await Announcement.findForFaculty(req.user.id);
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   POST /api/faculty/announcements/:id/dismiss
// @desc    Dismiss an announcement for this faculty
// @access  Private (Faculty only)
router.post('/announcements/:id/dismiss', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can dismiss announcements' });
  }

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    // Use dedicated dismiss SQL function (inserts into announcement_dismissed_by)
    await Announcement.dismiss(req.params.id, req.user.id);

    res.json({ message: 'Announcement dismissed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error dismissing announcement' });
  }
});

// @route   DELETE /api/faculty/announcements/:id
// @desc    Delete an announcement
// @access  Private (Faculty only)
router.delete('/announcements/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete their announcements' });
  }

  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

// @route   POST /api/faculty/polls
// @desc    Create a class poll for the faculty's assigned class
// @access  Private (Faculty only)
router.post('/polls', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create polls' });
  }

  const { title, description, closesAt, questions } = req.body;

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    if (!classContext) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin.' });
    }

    const poll = await Poll.create({
      title: String(title ?? '').trim(),
      description: String(description ?? '').trim(),
      closesAt: closesAt ? new Date(closesAt) : null,
      targetType: 'CLASS',
      targetGrade: classContext.assignedGrade,
      targetSection: classContext.assignedSection,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      status: 'ACTIVE',
      isPublished: true,
      questions: validateAndNormalizeQuestions(questions)
    });

    const [hydratedPoll] = await hydratePolls([poll]);
    res.status(201).json({ message: 'Poll created successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating poll' });
  }
});

// @route   GET /api/faculty/polls
// @desc    Get faculty-created polls plus admin polls for the class
// @access  Private (Faculty only)
router.get('/polls', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view polls' });
  }

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    const classFilter = classContext ? buildClassAudienceFilter({
      grade: classContext.assignedGrade,
      section: classContext.assignedSection
    }) : null;

    // Use SQL-native findForFaculty for polls
    const allPolls = await Poll.find({ createdBy: req.user.id });
    const polls = allPolls;

    res.json(await hydratePolls(polls));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   PUT /api/faculty/polls/:id
// @desc    Update or close a faculty poll
// @access  Private (Faculty only)
router.put('/polls/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update polls' });
  }

  const { title, description, closesAt, status, questions } = req.body;

  try {
    const poll = await Poll.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (title !== undefined) poll.title = String(title).trim();
    if (description !== undefined) poll.description = String(description).trim();
    if (status !== undefined) poll.status = status;
    if (closesAt !== undefined) poll.closesAt = closesAt ? new Date(closesAt) : null;

    if (questions !== undefined) {
      const responseCount = await PollResponse.countDocuments({ pollId: poll._id });
      if (responseCount > 0) {
        return res.status(400).json({ message: 'Questions cannot be changed after votes have been submitted.' });
      }

      poll.questions = validateAndNormalizeQuestions(questions);
    }

    const updated = await Poll.save(poll);
    const [hydratedPoll] = await hydratePolls([updated]);

    res.json({ message: 'Poll updated successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating poll' });
  }
});

// @route   DELETE /api/faculty/polls/:id
// @desc    Delete a faculty poll and its responses
// @access  Private (Faculty only)
router.delete('/polls/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete polls' });
  }

  try {
    const poll = await Poll.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    await PollResponse.deleteMany({ pollId: req.params.id });
    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll' });
  }
});

// @route   GET /api/faculty/feedback
// @desc    Get feedback for the faculty's tracked class
// @access  Private (Faculty only)
router.get('/feedback', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view feedback' });
  }

  try {
    const feedback = await Feedback.find({ facultyId: req.user.id })
      
      
      ;

    res.json(enrichParentLinkedRecords(feedback));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   PUT /api/faculty/feedback/:id
// @desc    Update feedback review status
// @access  Private (Faculty only)
router.put('/feedback/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update feedback' });
  }

  const { status, staffNote } = req.body;

  try {
    let feedback = await Feedback.findOne({ _id: req.params.id, facultyId: req.user.id });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (status !== undefined) feedback.status = status;
    if (staffNote !== undefined) feedback.staffNote = String(staffNote).trim();
    feedback.updatedBy = req.user.id;

    feedback = await Feedback.save(feedback);

    res.json({ message: 'Feedback updated successfully.', feedback: enrichParentLinkedRecord(feedback) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback' });
  }
});

// @route   POST /api/faculty/events
// @desc    Create an upcoming event for the faculty's class
// @access  Private (Faculty only)
router.post('/events', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create events' });
  }

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    if (!classContext) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin.' });
    }

    const normalizedEvent = normalizeEventPayload(req.body);
    const event = await Event.create({
      ...normalizedEvent,
      targetType: 'CLASS',
      targetGrade: classContext.assignedGrade,
      targetSection: classContext.assignedSection,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      status: 'ACTIVE',
      isPublished: true
    });

    const [hydratedEvent] = await hydrateEvents([event]);
    res.status(201).json({ message: 'Event created successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating event' });
  }
});

// @route   GET /api/faculty/events
// @desc    Get faculty-created events plus admin events for the class
// @access  Private (Faculty only)
router.get('/events', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view events' });
  }

  try {
    await archivePastEvents();
    const classContext = await getFacultyClassContext(req.user.id);
    const classFilter = classContext ? buildClassAudienceFilter({
      grade: classContext.assignedGrade,
      section: classContext.assignedSection
    }) : null;

    // Show events created by this faculty (admin events visible via parent/public routes)
    const events = await Event.find({ createdBy: req.user.id });
    res.json(await hydrateEvents(events));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   PUT /api/faculty/events/:id
// @desc    Update or close a faculty-created event
// @access  Private (Faculty only)
router.put('/events/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update events' });
  }

  const { status } = req.body;

  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const normalizedPayload = normalizeEventPayload({
      title: req.body.title ?? event.title,
      description: req.body.description ?? event.description,
      venue: req.body.venue ?? event.venue,
      eventDate: req.body.eventDate ?? event.eventDate
    });

    Object.assign(event, normalizedPayload);
    if (status !== undefined) event.status = status;

    const saved = await Event.save(event);
    const [hydratedEvent] = await hydrateEvents([saved]);

    res.json({ message: 'Event updated successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating event' });
  }
});

// @route   DELETE /api/faculty/events/:id
// @desc    Delete a faculty-created event and its registrations
// @access  Private (Faculty only)
router.delete('/events/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete events' });
  }

  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await EventRegistration.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// @route   GET /api/faculty/leave-requests
router.get('/leave-requests', protect, async (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty only' });
  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty?.assignedGrade || !faculty?.assignedSection) {
      return res.json([]);
    }
    const leaves = await LeaveRequest.findByClass(faculty.assignedGrade, faculty.assignedSection);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// @route   PUT /api/faculty/leave-requests/:id
router.put('/leave-requests/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty only' });
  const { status, reviewNote } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await LeaveRequest.updateStatus(req.params.id, { status, reviewNote, reviewedBy: req.user.id });
    res.json({ message: `Leave request ${status.toLowerCase()}.` });

    // Push notification (fire-and-forget)
    const leave = await LeaveRequest.findById(req.params.id);
    if (leave) notifyLeaveStatusChanged(leave.studentId, leave.studentName || 'Student', status).catch(() => {});
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave request' });
  }
});

// ══════════════════════════════════════════════════
// FACULTY'S OWN LEAVE REQUESTS
// ══════════════════════════════════════════════════
router.post('/my-leaves', protect, async (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty only' });
  const { leaveType, startDate, endDate, reason } = req.body;
  try {
    const leave = await FacultyLeaveRequest.create({
      facultyId: req.user.id,
      leaveType,
      startDate,
      endDate,
      reason
    });
    res.status(201).json({ message: 'Leave request submitted.', leave });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave request' });
  }
});

router.get('/my-leaves', protect, async (req, res) => {
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty only' });
  try {
    const leaves = await FacultyLeaveRequest.findByFaculty(req.user.id);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching my leave requests' });
  }
});

// ══════════════════════════════════════════════════
// WHATSAPP GROUP LINK & CONTACT
// ══════════════════════════════════════════════════
router.get('/whatsapp-info', protect, async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id);
    res.json({ whatsappLink: faculty?.whatsapp_link || '', contactNumber: faculty?.contact_number || '' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching WhatsApp info' });
  }
});

router.put('/whatsapp-info', protect, facultyOrAdmin, async (req, res) => {
  const { whatsappLink, contactNumber } = req.body;
  try {
    const pool = (await import('../db/pool.js')).default;
    const fields = [];
    const params = [];
    if (whatsappLink !== undefined) { fields.push('whatsapp_link = ?'); params.push(whatsappLink || null); }
    if (contactNumber !== undefined) { fields.push('contact_number = ?'); params.push(contactNumber || null); }
    if (fields.length) {
      params.push(req.user.id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    res.json({ message: 'WhatsApp info updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating WhatsApp info' });
  }
});

// ══════════════════════════════════════════════════
// TRANSPORT
// ══════════════════════════════════════════════════
// @route   GET /api/faculty/my-transport
// @desc    Get personal transport details for the logged-in faculty
router.get('/my-transport', protect, facultyOrAdmin, async (req, res) => {
  try {
    const transport = await Transport.findByFaculty(req.user.id);
    res.json(transport);
  } catch (error) {
    console.error('[Faculty My Transport]', error);
    res.status(500).json({ message: 'Error fetching personal transport info' });
  }
});
// @route   GET /api/faculty/transport
// @desc    Get transport details for all students in the assigned class
router.get('/transport', protect, facultyOrAdmin, async (req, res) => {
  try {
    const context = await getFacultyClassContext(req.user.id);
    if (!context) return res.json([]);
    const { assignedGrade: grade, assignedSection: section } = context;

    // We fetch all students in this class, then their transport records
    const students = await Student.find({ grade, section });
    const transportRecords = [];
    
    for (const student of students) {
      const transport = await Transport.findByStudent(student._id);
      if (transport) {
        transportRecords.push({
          studentId: student._id,
          studentName: student.name,
          srvNumber: student.srvNumber,
          ...transport
        });
      }
    }
    res.json(transportRecords);
  } catch (error) {
    console.error('[Faculty Transport]', error);
    res.status(500).json({ message: 'Error fetching transport info' });
  }
});

// ══════════════════════════════════════════════════
// LIBRARY
// ══════════════════════════════════════════════════
router.get('/library/books', protect, facultyOrAdmin, async (req, res) => {
  const { category, search } = req.query;
  try {
    const books = await Library.findAllBooks({ category, search });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books' });
  }
});

router.get('/library/issues', protect, facultyOrAdmin, async (req, res) => {
  try {
    const context = await getFacultyClassContext(req.user.id);
    if (!context) return res.json([]);
    const { assignedGrade: grade, assignedSection: section } = context;
    
    // Fetch all issues
    const issues = await Library.findAllIssues({ status: 'ISSUED' });
    
    // Filter issues to only include students in this faculty's class
    const classIssues = issues.filter(issue => issue.grade === grade && issue.section === section);
    res.json(classIssues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching library issues' });
  }
});

router.post('/library/issue', protect, facultyOrAdmin, async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  try {
    const issue = await Library.issueBook({ bookId, studentId, issuedBy: req.user.id, dueDate });
    res.status(201).json({ message: 'Book issued successfully', issue });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error issuing book' });
  }
});

router.post('/library/return/:id', protect, facultyOrAdmin, async (req, res) => {
  try {
    const issue = await Library.returnBook(req.params.id);
    res.json({ message: 'Book returned successfully', issue });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error returning book' });
  }
});

// ══════════════════════════════════════════════════
// CIRCULARS
// ══════════════════════════════════════════════════
router.get('/circulars', protect, facultyOrAdmin, async (req, res) => {
  try {
    const context = await getFacultyClassContext(req.user.id);
    const filters = context ? { targetGrade: context.assignedGrade, targetSection: context.assignedSection } : {};
    const circulars = await Circular.findAll(filters);
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching circulars' });
  }
});

// ══════════════════════════════════════════════════
// CAFETERIA MENU
// ══════════════════════════════════════════════════
router.get('/cafeteria', protect, async (req, res) => {
  try {
    const menu = await FoodMenu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cafeteria menu' });
  }
});

export default router;
