import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import FoodMenu from '../models/FoodMenu.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import PasswordReset from '../models/PasswordReset.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Memory from '../models/Memory.js';
import Attendance from '../models/Attendance.js';
import Enquiry from '../models/Enquiry.js';
import HomeworkSubmission from '../models/HomeworkSubmission.js';
import LeaveRequest from '../models/LeaveRequest.js';
import FacultyLeaveRequest from '../models/FacultyLeaveRequest.js';
import { notifyLeaveStatusChanged, notifyAnnouncement } from '../services/pushNotification.js';
import Circular from '../models/Circular.js';
import Transport from '../models/Transport.js';
import Library from '../models/Library.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { hydratePolls } from '../utils/pollService.js';
import { normalizeClassValue, validateAndNormalizeQuestions } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { normalizeEventPayload } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';
import { applyStudentFamilyDetails, validateStudentFamilyDetails } from '../utils/studentFamilyDetails.js';
import { buildParentDisplayName, enrichParentLinkedRecord, enrichParentLinkedRecords } from '../utils/parentProfile.js';
import { hasParentMobileNumber, normalizeParentMobileNumber, syncParentAccountDetails } from '../utils/parentContact.js';
import {
  buildCloudinaryUploadConfig,
  buildCloudinaryUploadSignature,
  destroyCloudinaryAsset,
  getCloudinaryGalleryFolder,
  fetchCloudinaryGalleryImages
} from '../utils/cloudinary.js';

const router = express.Router();
const MAX_MEMORY_IMAGE_BYTES = 5 * 1024 * 1024;
const normalizeRecoveryAnswer = (value) => String(value || '').trim().toLowerCase();

// Generate a random 4 digit string
const generateRandomDigits = () => Math.floor(1000 + Math.random() * 9000).toString();

// @route   POST /api/admin/faculty
// @desc    Register a new faculty member
// @access  Private (Admin only)
router.post('/faculty', protect, adminOnly, async (req, res) => {
  const { name, assignedGrade, assignedSection, password, mobileNumber } = req.body;

  try {
    // Generate a unique sequential SRV number for faculty (e.g., FAC26001)
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `FAC${year}`;
    const lastFaculty = await User.findLastBySrvPrefix('faculty', prefix);

    let sequence = '001';
    if (lastFaculty && lastFaculty.srvNumber) {
      const lastSequence = parseInt(lastFaculty.srvNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSequence)) {
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }
    }
    const srvNumber = `${prefix}${sequence}`;
    const salt = await bcrypt.genSalt(10);
    const assignedPassword = password || (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6));
    const hashedPassword = await bcrypt.hash(assignedPassword, salt);

    const faculty = await User.create({
      name,
      srvNumber,
      password: hashedPassword,
      role: 'faculty',
      assignedGrade,
      assignedSection,
      mobileNumber
    });

    // Sync faculty mappings so existing students get assigned to this new faculty
    await Student.syncFacultyMappings();

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        srvNumber: faculty.srvNumber,
        assignedGrade: faculty.assignedGrade,
        assignedSection: faculty.assignedSection,
        mobileNumber: faculty.mobileNumber,
        initialPassword: assignedPassword // Return only once so admin can share
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding faculty' });
  }
});

// @route   POST /api/admin/student
// @desc    Register a new student and generate their parent account
// @access  Private (Admin only)
router.post('/student', protect, adminOnly, async (req, res) => {
  const { name, grade, section, group, dateOfBirth, contactNumber, address, admissionNumber } = req.body;

  try {
    const familyValidation = validateStudentFamilyDetails(req.body);
    if (!familyValidation.isValid) {
      return res.status(400).json({ message: familyValidation.message });
    }

    const parentMobileNumber = normalizeParentMobileNumber(req.body.parentMobileNumber);

    let srvNumber;

    if (admissionNumber && admissionNumber.toString().trim() !== '') {
      // Admin provided a custom admission number — validate numeric only
      const numStr = admissionNumber.toString().trim();
      if (!/^\d+$/.test(numStr)) {
        return res.status(400).json({ message: 'Admission number must contain only digits (e.g., 1695)' });
      }
      srvNumber = `SRV${numStr}`;

      // Check uniqueness
      const existing = await Student.findOne({ srvNumber });
      if (existing) {
        return res.status(400).json({ message: `SRV number ${srvNumber} is already assigned to another student.` });
      }
    } else {
      // Auto-generate sequential SRV number (e.g., SRV26001)
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `SRV${year}`;
      const lastStudent = await Student.findLastBySrvPrefix(prefix);

      let sequence = '001';
      if (lastStudent && lastStudent.srvNumber) {
        const lastSequence = parseInt(lastStudent.srvNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSequence)) {
          sequence = (lastSequence + 1).toString().padStart(3, '0');
        }
      }
      srvNumber = `${prefix}${sequence}`;
    }

    // 2. Create the Student record
    const student = await Student.create({
      name,
      srvNumber,
      grade,
      section,
      group,
      ...familyValidation.familyDetails,
      parentMobileNumber,
      dateOfBirth,
      contactNumber,
      address,
      facultyId: null
    });

    // 3. Automatically create the Parent login account
    const salt = await bcrypt.genSalt(10);
    
    let defaultPassword;
    if (dateOfBirth) {
      // Parse directly from string to avoid timezone shifts (yyyy-mm-dd)
      const parts = String(dateOfBirth).split('T')[0].split('-');
      const yyyy = parts[0] || '';
      const mm   = parts[1] || '';
      const dd   = parts[2] || '';
      defaultPassword = `${dd}${mm}${yyyy}`;
    } else {
      defaultPassword = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    }
    
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const parentUser = await User.create({
      name: buildParentDisplayName(student, `Parent of ${name}`),
      srvNumber: student.srvNumber,
      password: hashedPassword,
      role: 'parent',
      studentId: student._id,
      mobileNumber: parentMobileNumber
    });

    // Sync faculty mapping for the newly created student
    await Student.syncFacultyMappings();

    res.status(201).json({
      message: 'Student and Parent account created successfully',
      student,
      parentMobileMissing: !hasParentMobileNumber(parentMobileNumber),
      parentLogin: {
        srvNumber: parentUser.srvNumber,
        defaultPassword
      }
    });

  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SRV number is already in use. Please choose a different admission number.' });
    }
    res.status(500).json({ message: 'Server error adding student' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard aggregated stats
// @access  Private (Admin only)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalEvents = await Event.countDocuments();
    const totalPolls = await Poll.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();
    const totalEnquiries = await Enquiry.countDocuments({ status: { $ne: 'Converted' } });

    res.json({
      totalStudents,
      totalFaculty,
      totalEvents,
      totalPolls,
      totalFeedback,
      totalAnnouncements,
      totalEnquiries
    });
  } catch (error) {
    res.status(500).json({ message: 'Server errors fetching stats' });
  }
});

// @route   GET /api/admin/food
// @desc    Get the entire weekly food menu
// @access  Private (Admin only)
router.get('/food', protect, adminOnly, async (req, res) => {
  try {
    const menu = await FoodMenu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food menu' });
  }
});

// @route   POST /api/admin/food
// @desc    Update food menu for a specific day
// @access  Private (Admin only)
router.post('/food', protect, adminOnly, async (req, res) => {
  const { day, breakfast, lunch, snacks } = req.body;
  try {
    let menu = await FoodMenu.findOne({ day });
    if (menu) {
      menu.breakfast = breakfast;
      menu.lunch = lunch;
      menu.snacks = snacks;
      menu = await FoodMenu.save(menu);
    } else {
      menu = await FoodMenu.create({ day, breakfast, lunch, snacks });
    }
    res.status(200).json({ message: 'Menu updated successfully', menu });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating menu' });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students sorted by numeric SRV portion
// @access  Private (Admin only)
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.findWithFaculty();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @route   GET /api/admin/faculty
// @desc    Get all faculty members
// @access  Private (Admin only)
router.get('/faculty', protect, adminOnly, async (req, res) => {
  try {
    const faculty = await User.findByRole('faculty');
    // strip sensitive fields
    const safe = faculty.map(f => { const { password, recoveryAnswerHash, ...rest } = f; return rest; });
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty' });
  }
});

// @route   PUT /api/admin/faculty/:id
// @desc    Update faculty assignment and/or password
// @access  Private (Admin only)
router.put('/faculty/:id', protect, adminOnly, async (req, res, next) => {
  const { name, mobileNumber, assignedGrade, assignedSection, maxStudents, handledClasses, password, recoveryQuestion, recoveryAnswer } = req.body;
  try {
    let faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (name !== undefined) faculty.name = String(name).trim();
    if (mobileNumber !== undefined) faculty.mobileNumber = String(mobileNumber).trim();
    if (assignedGrade !== undefined) faculty.assignedGrade = assignedGrade;
    if (assignedSection !== undefined) faculty.assignedSection = assignedSection;
    if (maxStudents !== undefined) faculty.maxStudents = maxStudents;
    if (handledClasses !== undefined) faculty.handledClasses = handledClasses;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);
    }

    if (recoveryQuestion !== undefined) {
      faculty.recoveryQuestion = String(recoveryQuestion || '').trim();
    }
    if (recoveryAnswer !== undefined) {
      const normalizedAnswer = normalizeRecoveryAnswer(recoveryAnswer);
      if (normalizedAnswer) {
        const salt = await bcrypt.genSalt(10);
        faculty.recoveryAnswerHash = await bcrypt.hash(normalizedAnswer, salt);
      } else if (!faculty.recoveryQuestion) {
        faculty.recoveryAnswerHash = '';
      }
    }

    faculty = await User.save(faculty);

    res.json({ message: 'Faculty updated successfully', faculty });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/faculty/:id/assign-students
// @desc    Manually assign students to a faculty (up to their maxStudents limit)
// @access  Private (Admin only)
router.post('/faculty/:id/assign-students', protect, adminOnly, async (req, res) => {
  const { studentIds } = req.body; // array of string IDs
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Unassign current students from this faculty
    await Student.updateMany({ facultyId: faculty._id }, { $set: { facultyId: null } });

    // Assign the new list (capped to maxStudents)
    const idsToAssign = Array.isArray(studentIds) ? studentIds.slice(0, faculty.maxStudents) : [];
    if (idsToAssign.length > 0) {
      await Student.updateMany({ _id: { $in: idsToAssign } }, { $set: { facultyId: faculty._id } });
    }

    res.json({ message: `Successfully synced ${idsToAssign.length} students` });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/faculty/:id
// @desc    Delete a faculty member
// @access  Private (Admin only)
router.delete('/faculty/:id', protect, adminOnly, async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Unassign their students safely
    await Student.updateMany({ facultyId: req.params.id }, { $set: { facultyId: null } });

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting faculty' });
  }
});

// @route   PUT /api/admin/student/:id/fees
// @desc    Update a student's fee details
// @access  Private (Admin only)
router.put('/student/:id/fees', protect, adminOnly, async (req, res) => {
  const { term1, term1Amount, term1Paid, term2, term2Amount, term2Paid, term3, term3Amount, term3Paid, overall, additionalFees, additionalPaid } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.fees) student.fees = {};
    if (term1) student.fees.term1 = term1;
    if (term1Amount !== undefined) student.fees.term1Amount = Number(term1Amount);
    if (term1Paid !== undefined) student.fees.term1Paid = Number(term1Paid);
    if (term2) student.fees.term2 = term2;
    if (term2Amount !== undefined) student.fees.term2Amount = Number(term2Amount);
    if (term2Paid !== undefined) student.fees.term2Paid = Number(term2Paid);
    if (term3) student.fees.term3 = term3;
    if (term3Amount !== undefined) student.fees.term3Amount = Number(term3Amount);
    if (term3Paid !== undefined) student.fees.term3Paid = Number(term3Paid);
    if (overall) student.fees.overall = overall;
    if (additionalFees !== undefined) student.fees.additionalFees = Number(additionalFees);
    if (additionalPaid !== undefined) student.fees.additionalPaid = Number(additionalPaid);

    student = await Student.save(student);
    res.json({ message: 'Fees updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fees' });
  }
});

// @route   PUT /api/admin/student/:id
// @desc    Edit student details
// @access  Private (Admin only)
router.put('/student/:id', protect, adminOnly, async (req, res) => {
  const { name, grade, section, group, parentRecoveryQuestion, parentRecoveryAnswer } = req.body;
  try {
    let student = await Student.findById(req.params.id);
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

    student = await Student.save(student);
    await syncParentAccountDetails(student, `Parent of ${student.name}`);

    if (parentRecoveryQuestion !== undefined || parentRecoveryAnswer !== undefined) {
      let parentUser = await User.findOne({ role: 'parent', student_id: student._id });
      if (parentUser) {
        if (parentRecoveryQuestion !== undefined) {
          parentUser.recoveryQuestion = String(parentRecoveryQuestion || '').trim();
        }
        if (parentRecoveryAnswer !== undefined) {
          const normalizedAnswer = normalizeRecoveryAnswer(parentRecoveryAnswer);
          if (normalizedAnswer) {
            const salt = await bcrypt.genSalt(10);
            parentUser.recoveryAnswerHash = await bcrypt.hash(normalizedAnswer, salt);
          } else if (!parentUser.recoveryQuestion) {
            parentUser.recoveryAnswerHash = '';
          }
        }
        parentUser = await User.save(parentUser);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('[Update Student Error]', error);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// @route   GET /api/admin/memories
// @desc    Get uploaded memories for admin management
// @access  Private (Admin only)
router.get('/memories', protect, adminOnly, async (req, res) => {
  try {
    const images = await fetchCloudinaryGalleryImages();
    // Map them to look like the Memory model so the frontend works
    const mappedMemories = images.map(img => ({
      _id: img.publicId.replace(/\//g, '___'), // Encode slashes safely for explicit frontend routing
      title: img.title,
      description: img.description,
      secureUrl: img.secureUrl,
      publicId: img.publicId,
      resourceType: img.resourceType || 'image',
      bytes: img.bytes,
      format: img.format,
      originalFilename: img.originalFilename,
      folder: img.folder,
      createdAt: img.createdAt
    }));
    res.json(mappedMemories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memories' });
  }
});

// @route   GET /api/admin/memories/upload-config
// @desc    Get Cloudinary upload configuration for direct browser uploads
// @access  Private (Admin only)
router.get('/memories/upload-config', protect, adminOnly, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadConfig({
      folder: getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error loading upload configuration' });
  }
});

// @route   POST /api/admin/memories/upload-signature
// @desc    Create signed Cloudinary upload params for browser uploads
// @access  Private (Admin only)
router.post('/memories/upload-signature', protect, adminOnly, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadSignature({
      folder: req.body?.folder || getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create upload signature.' });
  }
});

// @route   POST /api/admin/memories
// @desc    Save uploaded memory metadata
// @access  Private (Admin only)
router.post('/memories', protect, adminOnly, async (req, res) => {
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
    if (normalizedResourceType === 'image' && fileBytes > MAX_MEMORY_IMAGE_BYTES) {
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
      createdByRole: 'admin',
      studentId: studentId || null
    });

    res.status(201).json({ message: 'Memory saved successfully.', memory });
  } catch (error) {
    res.status(500).json({ message: 'Error saving memory.' });
  }
});

// @route   DELETE /api/admin/memories/:id
// @desc    Delete a memory from the portal and Cloudinary when fully configured
// @access  Private (Admin only)
router.delete('/memories/:id', protect, adminOnly, async (req, res) => {
  try {
    const rawId = req.params.id;

    // Support either local DB _id or encoded publicId from Cloudinary
    let publicId, memory;
    if (rawId.includes('___')) {
      publicId = rawId.replace(/___/g, '/');
      memory = await Memory.findOne({ publicId });
    } else {
      memory = await Memory.findById(rawId);
      publicId = memory?.publicId;
    }

    if (!publicId && !memory) {
      return res.status(404).json({ message: 'Memory not found.' });
    }

    let remoteDeleted = false;
    if (publicId) {
      try {
        const remoteResult = await destroyCloudinaryAsset({
          publicId: publicId,
          // Since we might not know resourceType if it's completely missing from DB, we try image by default.
          // In a perfect system we'd know or try both.
          resourceType: memory ? memory.resourceType : 'image'
        });
        remoteDeleted = Boolean(remoteResult?.ok);
      } catch (cloudinaryError) {
        console.warn('[Memory Delete] Cloudinary cleanup skipped:', cloudinaryError.message);
      }
    }

    if (memory) {
      await Memory.findByIdAndDelete(memory._id);
    } else {
      // Just in case there is a rogue document by exact publicID
      await Memory.findOneAndDelete({ publicId });
    }

    res.json({
      message: 'Memory deleted successfully.',
      remoteDeleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting memory.' });
  }
});

// @route   POST /api/admin/students/promote
// @desc    Bulk promote students from one grade to the next
// @access  Private (Admin only)
router.post('/students/promote', protect, adminOnly, async (req, res) => {
  const { fromGrade, toGrade } = req.body;
  try {
    if (!fromGrade || !toGrade) {
      return res.status(400).json({ message: 'Both fromGrade and toGrade are required.' });
    }

    const result = await Student.updateMany(
      { grade: fromGrade },
      { $set: { grade: toGrade } }
    );

    // Sync faculty mappings after bulk promotion
    await Student.syncFacultyMappings();

    res.json({
      message: `Successfully promoted ${result.modifiedCount} student(s) from Grade ${fromGrade} to Grade ${toGrade}.`,
      promoted: result.modifiedCount
    });
  } catch (error) {
    console.error('[Promote Error]', error);
    res.status(500).json({ message: 'Error promoting students' });
  }
});

// @route   POST /api/admin/students/sync-faculty
// @desc    Auto-assign all students to faculty based on matching grade and section
// @access  Private (Admin only)
router.post('/students/sync-faculty', protect, adminOnly, async (req, res) => {
  try {
    await Student.syncFacultyMappings();
    res.json({ message: 'All student-faculty mappings have been synchronized.' });
  } catch (error) {
    console.error('[Sync Faculty Mappings Error]', error);
    res.status(500).json({ message: 'Error synchronizing mappings.' });
  }
});

// @route   PUT /api/admin/student/:id/srv
// @desc    Edit a student's SRV number (admin enters numeric part only)
// @access  Private (Admin only)
router.put('/student/:id/srv', protect, adminOnly, async (req, res) => {
  const { admissionNumber } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const numStr = (admissionNumber || '').toString().trim();
    if (!/^\d+$/.test(numStr)) {
      return res.status(400).json({ message: 'Admission number must contain only digits (e.g., 1695)' });
    }
    const newSrvNumber = `SRV${numStr}`;

    if (newSrvNumber === student.srvNumber) {
      return res.status(400).json({ message: 'This SRV number is already assigned. Please enter a unique ID.' });
    }

    const existing = await Student.findOne({ srvNumber: newSrvNumber });
    if (existing) {
      return res.status(400).json({ message: `SRV number ${newSrvNumber} is already assigned. Please enter a unique ID.` });
    }

    const oldSrvNumber = student.srvNumber;
    student.srvNumber = newSrvNumber;
    student = await Student.save(student);

    // Also update the parent User account's srvNumber so login still works
    await User.updateOne({ srvNumber: oldSrvNumber, role: 'parent' }, { $set: { srvNumber: newSrvNumber } });

    res.json({ message: `SRV number updated to ${newSrvNumber}. Parent login ID changed, password unchanged.`, student });
  } catch (error) {
    console.error('[Edit SRV Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SRV number is already in use. Please enter a unique ID.' });
    }
    res.status(500).json({ message: 'Error updating SRV number' });
  }
});

// @route   DELETE /api/admin/student/:id
// @desc    Delete a student and their associated parent account
// @access  Private (Admin only)
router.delete('/student/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade delete: remove the parent's login account associated with this student
    await User.findOneAndDelete({ role: 'parent', studentId: req.params.id });

    res.json({ message: 'Student and associated parent account deleted successfully' });
  } catch (error) {
    console.error('[Delete Student Route Error]', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// @route   GET /api/admin/settings/fee-toggle
// @desc    Get the online fee setting
// @access  Private (Admin only)
router.get('/settings/fee-toggle', protect, adminOnly, async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting) setting = await Setting.create({ key: 'onlineFeePayment', value: false });
    res.json({ isOnlineFeeEnabled: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching setting' });
  }
});

// @route   PUT /api/admin/settings/fee-toggle
// @desc    Toggle online fee setting
// @access  Private (Admin only)
router.put('/settings/fee-toggle', protect, adminOnly, async (req, res) => {
  const { isEnabled } = req.body;
  try {
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting) {
      setting = await Setting.create({ key: 'onlineFeePayment', value: isEnabled });
    } else {
      setting.value = isEnabled;
      setting = await Setting.save(setting);
    }
    res.json({ message: 'Setting updated successfully', isOnlineFeeEnabled: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating setting' });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get system notifications (FEE_ALERTs)
// @access  Private (Admin only)
router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const notifications = await Notification.find({ type: 'FEE_ALERT' }, { limit: 20 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin notifications' });
  }
});

// @route   GET /api/admin/attendance/student/:studentId
// @desc    Get ALL attendance records for a student across ALL academic years (admin only)
// @access  Private (Admin only)
router.get('/attendance/student/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const { academicYear } = req.query; // optional filter
    const studentId = req.params.studentId;
    const query = academicYear ? { academicYear } : {};
    const allLogs = await Attendance.find(query);
    // Filter records to only this student's entries
    const result = allLogs
      .map(log => {
        const studentRecords = (log.records || []).filter(
          r => r.studentId && r.studentId.toString() === studentId.toString()
        );
        if (!studentRecords.length) return null;
        return {
          date: log.date,
          academicYear: log.academicYear,
          grade: log.grade,
          section: log.section,
          status: studentRecords[0].status,
          remarks: studentRecords[0].remarks
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(result);
  } catch (error) {
    console.error('[Admin Attendance Fetch Error]', error);
    res.status(500).json({ message: 'Error fetching attendance data' });
  }
});

// @route   GET /api/admin/attendance/academic-years
// @desc    Get list of all academic years that have attendance data
// @access  Private (Admin only)
router.get('/attendance/academic-years', protect, adminOnly, async (req, res) => {
  try {
    const allLogs = await Attendance.find({});
    const years = [...new Set(allLogs.map(l => l.academicYear).filter(Boolean))];
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching academic years' });
  }
});


// @route   GET /api/admin/password-requests
// @desc    Get all pending password reset requests
// @access  Private (Admin only)
router.get('/password-requests', protect, adminOnly, async (req, res) => {
  try {
    const requests = await PasswordReset.find({ status: 'Pending' });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching password requests' });
  }
});

// @route   POST /api/admin/password-requests/:id/approve
// @desc    Approve and process a password reset
// @access  Private (Admin only)
router.post('/password-requests/:id/approve', protect, adminOnly, async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (!newPassword) return res.status(400).json({ message: 'New password is required.' });

    const request = await PasswordReset.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    const user = await User.findOne({ srvNumber: request.srvNumber });
    if (!user) return res.status(404).json({ message: 'User account no longer exists.' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user = await User.save(user);

    // Update request
    request.status = 'Reset';
    request.newPassword = newPassword;
    request = await PasswordReset.save(request);

    res.json({ message: 'Password successfully reset.', request });
  } catch (error) {
    res.status(500).json({ message: 'Error approving password request' });
  }
});

// @route   POST /api/admin/announcements
// @desc    Create a global, class, or faculty announcement
// @access  Private (Admin only)
router.post('/announcements', protect, adminOnly, async (req, res) => {
  const { title, message, priority, targetType, targetGrade, targetSection, recipients, selectedFacultyIds } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const normalizedTargetType = String(targetType || '').trim().toUpperCase();
    const facultyRecipients = Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : selectedFacultyIds;

    // Determine announcement type
    let type = 'GLOBAL';
    let announcementData = {
      title,
      message,
      priority: priority || 'MEDIUM',
      createdBy: req.user.id,
      createdByRole: 'admin',
      isPublished: true
    };

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Target grade and section are required for CLASS announcements' });
      }
      type = 'CLASS';
      announcementData.targetGrade = targetGrade;
      announcementData.targetSection = targetSection;
    } else if (normalizedTargetType === 'FACULTY') {
      if (!facultyRecipients || facultyRecipients.length === 0) {
        return res.status(400).json({ message: 'Recipients are required for FACULTY announcements' });
      }
      type = 'FACULTY';
      announcementData.recipients = facultyRecipients;
    } else {
      type = 'GLOBAL';
    }

    announcementData.type = type;

    const announcement = await Announcement.create(announcementData);

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });

    // Push notification (fire-and-forget)
    notifyAnnouncement(title, announcementData.targetGrade, announcementData.targetSection).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

// @route   GET /api/admin/announcements
// @desc    Get all announcements created by admin
// @access  Private (Admin only)
router.get('/announcements', protect, adminOnly, async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user.id });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete an announcement
// @access  Private (Admin only)
router.delete('/announcements/:id', protect, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

// @route   PUT /api/admin/faculty/:id/srv
// @desc    Edit a faculty FAC number (admin enters numeric part only)
// @access  Private (Admin only)
router.put('/faculty/:id/srv', protect, adminOnly, async (req, res) => {
  const { facultyNumber } = req.body;
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const numStr = (facultyNumber || '').toString().trim();
    if (!/^\d+$/.test(numStr)) {
      return res.status(400).json({ message: 'Faculty number must contain only digits (e.g., 26001)' });
    }

    const newFacultyNumber = `FAC${numStr}`;

    if (newFacultyNumber === faculty.srvNumber) {
      return res.status(400).json({ message: 'This FAC number is already assigned. Please enter a unique ID.' });
    }

    const existing = await User.findOne({ srvNumber: newFacultyNumber });
    if (existing) {
      return res.status(400).json({ message: `FAC number ${newFacultyNumber} is already assigned. Please enter a unique ID.` });
    }

    faculty.srvNumber = newFacultyNumber;
    faculty = await User.save(faculty);

    res.json({ message: `FAC number updated to ${newFacultyNumber}. Faculty login ID changed, password unchanged.`, faculty });
  } catch (error) {
    console.error('[Edit FAC Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This FAC number is already in use. Please enter a unique ID.' });
    }
    res.status(500).json({ message: 'Error updating FAC number' });
  }
});

// @route   POST /api/admin/polls
// @desc    Create a new opinion poll
// @access  Private (Admin only)
router.post('/polls', protect, adminOnly, async (req, res) => {
  const { title, description, targetType, targetGrade, targetSection, closesAt, questions } = req.body;

  try {
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Poll title is required.' });
    }

    const normalizedQuestions = validateAndNormalizeQuestions(questions);
    const normalizedTargetType = targetType === 'GLOBAL' ? 'GLOBAL' : 'CLASS';

    const pollData = {
      title: String(title).trim(),
      description: String(description ?? '').trim(),
      targetType: normalizedTargetType,
      createdBy: req.user.id,
      createdByRole: 'admin',
      status: 'ACTIVE',
      isPublished: true,
      questions: normalizedQuestions
    };

    if (closesAt) {
      pollData.closesAt = new Date(closesAt);
    }

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Grade and section are required for class polls.' });
      }

      pollData.targetGrade = normalizeClassValue(targetGrade);
      pollData.targetSection = normalizeClassValue(targetSection);
    }

    const poll = await Poll.create(pollData);
    const [hydratedPoll] = await hydratePolls([poll]);

    res.status(201).json({ message: 'Poll created successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating poll' });
  }
});

// @route   GET /api/admin/polls
// @desc    Get all opinion polls with analytics
// @access  Private (Admin only)
router.get('/polls', protect, adminOnly, async (req, res) => {
  try {
    const polls = await Poll.find();
    res.json(await hydratePolls(polls));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   PUT /api/admin/polls/:id
// @desc    Update poll metadata or close a poll
// @access  Private (Admin only)
router.put('/polls/:id', protect, adminOnly, async (req, res) => {
  const { title, description, targetType, targetGrade, targetSection, closesAt, status, questions } = req.body;

  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (title !== undefined) poll.title = String(title).trim();
    if (description !== undefined) poll.description = String(description).trim();
    if (status !== undefined) poll.status = status;
    if (closesAt !== undefined) poll.closesAt = closesAt ? new Date(closesAt) : null;

    const nextTargetType = targetType || poll.targetType;
    if (nextTargetType === 'GLOBAL') {
      poll.targetType = 'GLOBAL';
      poll.targetGrade = undefined;
      poll.targetSection = undefined;
    } else {
      const resolvedGrade = normalizeClassValue(targetGrade ?? poll.targetGrade);
      const resolvedSection = normalizeClassValue(targetSection ?? poll.targetSection);

      if (!resolvedGrade || !resolvedSection) {
        return res.status(400).json({ message: 'Grade and section are required for class polls.' });
      }

      poll.targetType = 'CLASS';
      poll.targetGrade = resolvedGrade;
      poll.targetSection = resolvedSection;
    }

    if (questions !== undefined) {
      const responseCount = await PollResponse.countDocuments({ pollId: poll._id });
      if (responseCount > 0) {
        return res.status(400).json({ message: 'Questions cannot be changed after votes have been submitted.' });
      }

      poll.questions = validateAndNormalizeQuestions(questions);
    }

    poll = await Poll.save(poll);
    const [hydratedPoll] = await hydratePolls([poll]);

    res.json({ message: 'Poll updated successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating poll' });
  }
});

// @route   DELETE /api/admin/polls/:id
// @desc    Delete a poll and its responses
// @access  Private (Admin only)
router.delete('/polls/:id', protect, adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    await PollResponse.deleteMany({ pollId: req.params.id });
    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll' });
  }
});

// @route   GET /api/admin/feedback
// @desc    Get all parent feedback
// @access  Private (Admin only)
router.get('/feedback', protect, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find()



      ;

    res.json(enrichParentLinkedRecords(feedback));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   PUT /api/admin/feedback/:id
// @desc    Update feedback review status
// @access  Private (Admin only)
router.put('/feedback/:id', protect, adminOnly, async (req, res) => {
  const { status, staffNote } = req.body;

  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (status !== undefined) feedback.status = status;
    if (staffNote !== undefined) feedback.staffNote = String(staffNote).trim();
    feedback.updatedBy = req.user.id;

    feedback = await Feedback.save(feedback);
    await feedback;
    await feedback;
    await feedback;

    res.json({ message: 'Feedback updated successfully.', feedback: enrichParentLinkedRecord(feedback) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback' });
  }
});

// @route   POST /api/admin/events
// @desc    Create an upcoming event
// @access  Private (Admin only)
router.post('/events', protect, adminOnly, async (req, res) => {
  const { targetType, targetGrade, targetSection } = req.body;

  try {
    const normalizedEvent = normalizeEventPayload(req.body);
    const normalizedTargetType = String(targetType || '').trim().toUpperCase() === 'GLOBAL' ? 'GLOBAL' : 'CLASS';

    const eventData = {
      ...normalizedEvent,
      targetType: normalizedTargetType,
      createdBy: req.user.id,
      createdByRole: 'admin',
      status: 'ACTIVE',
      isPublished: true
    };

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Grade and section are required for class events.' });
      }
      eventData.targetGrade = normalizeClassValue(targetGrade);
      eventData.targetSection = normalizeClassValue(targetSection);
    }

    const event = await Event.create(eventData);
    const [hydratedEvent] = await hydrateEvents([event]);

    res.status(201).json({ message: 'Event created successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating event' });
  }
});

// @route   GET /api/admin/events
// @desc    Get all upcoming events with registrations
// @access  Private (Admin only)
router.get('/events', protect, adminOnly, async (req, res) => {
  try {
    await archivePastEvents();
    const events = await Event.find();
    res.json(await hydrateEvents(events));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Update or close an upcoming event
// @access  Private (Admin only)
router.put('/events/:id', protect, adminOnly, async (req, res) => {
  const { status, targetType, targetGrade, targetSection } = req.body;

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const normalizedPayload = normalizeEventPayload({
      title: req.body.title ?? event.title,
      description: req.body.description ?? event.description,
      venue: req.body.venue ?? event.venue,
      eventDate: req.body.eventDate ?? event.eventDate
    });

    Object.assign(event, normalizedPayload);
    if (status !== undefined) event.status = status;

    const normalizedTargetType = targetType ? String(targetType).trim().toUpperCase() : event.targetType;
    if (normalizedTargetType === 'GLOBAL') {
      event.targetType = 'GLOBAL';
      event.targetGrade = undefined;
      event.targetSection = undefined;
    } else {
      const grade = normalizeClassValue(targetGrade ?? event.targetGrade);
      const section = normalizeClassValue(targetSection ?? event.targetSection);
      if (!grade || !section) {
        return res.status(400).json({ message: 'Grade and section are required for class events.' });
      }
      event.targetType = 'CLASS';
      event.targetGrade = grade;
      event.targetSection = section;
    }

    event = await Event.save(event);
    const [hydratedEvent] = await hydrateEvents([event]);

    res.json({ message: 'Event updated successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating event' });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete an event and its registrations
// @access  Private (Admin only)
router.delete('/events/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await EventRegistration.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// ══════════════════════════════════════════════════
// LEAVE REQUESTS
// ══════════════════════════════════════════════════
router.get('/leave-requests', protect, adminOnly, async (req, res) => {
  try {
    const { status, grade } = req.query;
    const leaves = await LeaveRequest.findAll({ status, grade });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

router.put('/leave-requests/:id', protect, adminOnly, async (req, res) => {
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
// FACULTY LEAVE REQUESTS
// ══════════════════════════════════════════════════
router.get('/faculty-leaves', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const leaves = await FacultyLeaveRequest.findAll({ status });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty leave requests' });
  }
});

router.put('/faculty-leaves/:id', protect, adminOnly, async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await FacultyLeaveRequest.updateStatus(req.params.id, { status, reviewNote, reviewedBy: req.user.id });
    res.json({ message: `Faculty leave request ${status.toLowerCase()}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating faculty leave request' });
  }
});

// ══════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    // 1. Enrollment by grade
    const allStudents = await Student.find();
    const enrollmentByGrade = {};
    allStudents.forEach(s => {
      const g = s.grade || 'Unknown';
      enrollmentByGrade[g] = (enrollmentByGrade[g] || 0) + 1;
    });

    // 2. Fee collection summary
    let totalFeeAmount = 0, totalFeePaid = 0, paidCount = 0, unpaidCount = 0, partialCount = 0;
    allStudents.forEach(s => {
      const fees = s.fees || {};
      ['term1', 'term2', 'term3'].forEach(t => {
        const amt = Number(fees[t + 'Amount']) || 0;
        const paid = Number(fees[t + 'Paid']) || 0;
        totalFeeAmount += amt;
        totalFeePaid += paid;
        if (fees[t] === 'Paid') paidCount++;
        else if (fees[t] === 'Partial') partialCount++;
        else unpaidCount++;
      });
    });

    // 3. Attendance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceLogs = await Attendance.find();
    const dailyAttendance = {};
    attendanceLogs.forEach(log => {
      const d = new Date(log.date);
      if (d < thirtyDaysAgo) return;
      const key = d.toISOString().split('T')[0];
      if (!dailyAttendance[key]) dailyAttendance[key] = { present: 0, total: 0 };
      (log.records || []).forEach(r => {
        dailyAttendance[key].total++;
        if (r.status === 'Present') dailyAttendance[key].present++;
      });
    });
    const attendanceTrend = Object.entries(dailyAttendance)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { present, total }]) => ({ date, percentage: total > 0 ? Math.round((present / total) * 100) : 0 }));

    // 4. Behavior average by grade
    const behaviorLogs = await Behavior.find();
    const behaviorByGrade = {};
    behaviorLogs.forEach(log => {
      const g = log.grade || 'Unknown';
      if (!behaviorByGrade[g]) behaviorByGrade[g] = { sum: 0, count: 0 };
      (log.records || []).forEach(r => {
        if (r.score != null) { behaviorByGrade[g].sum += r.score; behaviorByGrade[g].count++; }
      });
    });
    const behaviorAverages = Object.entries(behaviorByGrade).map(([grade, { sum, count }]) => ({
      grade, average: count > 0 ? Math.round((sum / count) * 10) / 10 : 0
    }));

    // 5. Leave request summary
    const pendingLeaves = await LeaveRequest.countPending();

    res.json({
      enrollmentByGrade,
      feeCollection: { totalFeeAmount, totalFeePaid, paidCount, unpaidCount, partialCount },
      attendanceTrend,
      behaviorAverages,
      pendingLeaves
    });
  } catch (error) {
    console.error('[Analytics Error]', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
});

// ══════════════════════════════════════════════════
// DATA EXPORT (CSV)
// ══════════════════════════════════════════════════
router.get('/export/students', protect, adminOnly, async (req, res) => {
  try {
    let students = await Student.find();
    const { grade, section } = req.query;
    if (grade) students = students.filter(s => s.grade === grade);
    if (section) students = students.filter(s => s.section === section);

    const header = 'SRV Number,Name,Grade,Section,Group,Mother,Father,Guardian,Parent Mobile,DOB';
    const rows = students.map(s => [
      s.srvNumber, `"${(s.name || '').replace(/"/g, '""')}"`, s.grade, s.section, s.group || '',
      s.motherName || '', s.fatherName || '', s.guardianName || '', s.parentMobileNumber || '',
      s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : ''
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send([header, ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ message: 'Error exporting students' });
  }
});

router.get('/export/attendance', protect, adminOnly, async (req, res) => {
  try {
    const { grade, section } = req.query;
    let logs = await Attendance.find();
    if (grade) logs = logs.filter(l => l.grade === grade);
    if (section) logs = logs.filter(l => l.section === section);

    const header = 'Date,Grade,Section,Student ID,Status,Remarks';
    const rows = [];
    logs.forEach(log => {
      (log.records || []).forEach(r => {
        rows.push([log.date ? new Date(log.date).toLocaleDateString() : '', log.grade, log.section, r.studentId, r.status, (r.remarks || '').replace(/,/g, ';')].join(','));
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.send([header, ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ message: 'Error exporting attendance' });
  }
});

router.get('/export/fees', protect, adminOnly, async (req, res) => {
  try {
    let students = await Student.find();
    const { grade, section } = req.query;
    if (grade) students = students.filter(s => s.grade === grade);
    if (section) students = students.filter(s => s.section === section);

    const header = 'SRV Number,Name,Grade,Section,Term1 Status,Term1 Amount,Term1 Paid,Term2 Status,Term2 Amount,Term2 Paid,Term3 Status,Term3 Amount,Term3 Paid,Overall';
    const rows = students.map(s => {
      const f = s.fees || {};
      return [s.srvNumber, `"${(s.name || '').replace(/"/g, '""')}"`, s.grade, s.section,
        f.term1 || 'Unpaid', f.term1Amount || 0, f.term1Paid || 0,
        f.term2 || 'Unpaid', f.term2Amount || 0, f.term2Paid || 0,
        f.term3 || 'Unpaid', f.term3Amount || 0, f.term3Paid || 0,
        f.overall || ''
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fees.csv');
    res.send([header, ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ message: 'Error exporting fees' });
  }
});

// ══════════════════════════════════════════════════
// REPORT CARD
// ══════════════════════════════════════════════════
router.get('/report-card/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Academic records
    const AcademicRecord = (await import('../models/AcademicRecord.js')).default;
    const records = await AcademicRecord.find({ studentId: student._id });

    // Attendance
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

    // Behavior
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
        name: student.name, srvNumber: student.srvNumber,
        grade: student.grade, section: student.section,
        dateOfBirth: student.dateOfBirth,
        fatherName: student.fatherName, motherName: student.motherName
      },
      academics: records,
      attendance: { totalDays, presentDays, percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0 },
      behavior: { average: behaviorCount > 0 ? Math.round((behaviorSum / behaviorCount) * 10) / 10 : 0, totalEntries: behaviorCount }
    });
  } catch (error) {
    console.error('[Admin Report Card]', error);
    res.status(500).json({ message: 'Error generating report card' });
  }
});

// ══════════════════════════════════════════════════
// STUDENT PROMOTION
// ══════════════════════════════════════════════════
const GRADE_ORDER = ['Pre KG','LKG','UKG','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

router.get('/promotion/preview', protect, adminOnly, async (req, res) => {
  const { grade, section } = req.query;
  if (!grade) return res.status(400).json({ message: 'Grade is required' });
  try {
    const students = await Student.find(section ? { grade, section } : { grade });
    const currentIdx = GRADE_ORDER.indexOf(grade);
    const nextGrade = currentIdx >= 0 && currentIdx < GRADE_ORDER.length - 1 ? GRADE_ORDER[currentIdx + 1] : null;
    res.json({ students, currentGrade: grade, nextGrade, count: students.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotion preview' });
  }
});

router.post('/promotion/execute', protect, adminOnly, async (req, res) => {
  const { fromGrade, toGrade, section, studentIds } = req.body;
  if (!fromGrade || !toGrade) return res.status(400).json({ message: 'From and to grades are required' });
  try {
    const pool = (await import('../db/pool.js')).default;
    let sql, params;
    if (studentIds && studentIds.length > 0) {
      const placeholders = studentIds.map(() => '?').join(',');
      sql = `UPDATE students SET grade = ? WHERE id IN (${placeholders})`;
      params = [toGrade, ...studentIds];
    } else {
      sql = 'UPDATE students SET grade = ? WHERE grade = ?';
      params = [toGrade, fromGrade];
      if (section) { sql += ' AND section = ?'; params.push(section); }
    }
    const [result] = await pool.query(sql, params);
    res.json({ message: `Promoted ${result.affectedRows} student(s) from ${fromGrade} to ${toGrade}`, count: result.affectedRows });
  } catch (error) {
    console.error('[Promotion Error]', error);
    res.status(500).json({ message: 'Error executing promotion' });
  }
});

// ══════════════════════════════════════════════════
// CIRCULARS
// ══════════════════════════════════════════════════
router.get('/circulars', protect, adminOnly, async (req, res) => {
  try {
    const circulars = await Circular.findAll();
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching circulars' });
  }
});

router.post('/circulars', protect, adminOnly, async (req, res) => {
  const { title, description, fileUrl, targetType, targetGrade, targetSection } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const circular = await Circular.create({ title, description, fileUrl, targetType, targetGrade, targetSection, createdBy: req.user.id });
    res.status(201).json({ message: 'Circular published', circular });
    // Push notification
    notifyAnnouncement(`Circular: ${title}`, targetGrade, targetSection).catch(() => {});
  } catch (error) {
    res.status(500).json({ message: 'Error creating circular' });
  }
});

router.delete('/circulars/:id', protect, adminOnly, async (req, res) => {
  try {
    await Circular.deleteById(req.params.id);
    res.json({ message: 'Circular deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting circular' });
  }
});

// ══════════════════════════════════════════════════
// TRANSPORT MANAGEMENT
// ══════════════════════════════════════════════════
router.get('/transport/routes', protect, adminOnly, async (req, res) => {
  try {
    const routes = await Transport.findAllRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

router.post('/transport/routes', protect, adminOnly, async (req, res) => {
  const { routeName, busNumber, driverName, driverPhone, helperName, helperPhone, stops } = req.body;
  if (!routeName) return res.status(400).json({ message: 'Route name is required' });
  try {
    const route = await Transport.createRoute({ routeName, busNumber, driverName, driverPhone, helperName, helperPhone });
    if (stops && stops.length > 0) await Transport.setStops(route._id, stops);
    const full = await Transport.findRouteById(route._id);
    res.status(201).json({ message: 'Route created', route: full });
  } catch (error) {
    res.status(500).json({ message: 'Error creating route' });
  }
});

router.put('/transport/routes/:id', protect, adminOnly, async (req, res) => {
  const { routeName, busNumber, driverName, driverPhone, helperName, helperPhone, stops } = req.body;
  try {
    await Transport.updateRoute(req.params.id, { routeName, busNumber, driverName, driverPhone, helperName, helperPhone });
    if (stops) await Transport.setStops(req.params.id, stops);
    const full = await Transport.findRouteById(req.params.id);
    res.json({ message: 'Route updated', route: full });
  } catch (error) {
    res.status(500).json({ message: 'Error updating route' });
  }
});

router.delete('/transport/routes/:id', protect, adminOnly, async (req, res) => {
  try {
    await Transport.deleteRoute(req.params.id);
    res.json({ message: 'Route deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting route' });
  }
});

router.post('/transport/assign', protect, adminOnly, async (req, res) => {
  const { studentId, routeId, stopId } = req.body;
  if (!studentId || !routeId) return res.status(400).json({ message: 'Student and route are required' });
  try {
    await Transport.assignStudent(studentId, routeId, stopId);
    res.json({ message: 'Student assigned to transport route' });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning student' });
  }
});

router.delete('/transport/assign/:studentId', protect, adminOnly, async (req, res) => {
  try {
    await Transport.removeStudent(req.params.studentId);
    res.json({ message: 'Student removed from transport' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing student' });
  }
});

router.post('/transport/assign/faculty', protect, adminOnly, async (req, res) => {
  const { facultyId, routeId, stopId } = req.body;
  if (!facultyId || !routeId) return res.status(400).json({ message: 'Faculty and route are required' });
  try {
    await Transport.assignFaculty(facultyId, routeId, stopId);
    res.json({ message: 'Faculty assigned to transport route' });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning faculty' });
  }
});

router.delete('/transport/assign/faculty/:facultyId', protect, adminOnly, async (req, res) => {
  try {
    await Transport.removeFaculty(req.params.facultyId);
    res.json({ message: 'Faculty removed from transport' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing faculty' });
  }
});

// ══════════════════════════════════════════════════
// LIBRARY MANAGEMENT
// ══════════════════════════════════════════════════
router.get('/library/books', protect, adminOnly, async (req, res) => {
  try {
    const { category, search } = req.query;
    const books = await Library.findAllBooks({ category, search });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books' });
  }
});

router.post('/library/books', protect, adminOnly, async (req, res) => {
  const { title, author, isbn, category, totalCopies, shelfLocation } = req.body;
  if (!title) return res.status(400).json({ message: 'Book title is required' });
  try {
    const book = await Library.createBook({ title, author, isbn, category, totalCopies, shelfLocation });
    res.status(201).json({ message: 'Book added', book });
  } catch (error) {
    res.status(500).json({ message: 'Error adding book' });
  }
});

router.put('/library/books/:id', protect, adminOnly, async (req, res) => {
  try {
    const book = await Library.updateBook(req.params.id, req.body);
    res.json({ message: 'Book updated', book });
  } catch (error) {
    res.status(500).json({ message: 'Error updating book' });
  }
});

router.delete('/library/books/:id', protect, adminOnly, async (req, res) => {
  try {
    await Library.deleteBook(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book' });
  }
});

router.get('/library/categories', protect, adminOnly, async (req, res) => {
  try {
    const cats = await Library.getCategories();
    res.json(cats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

router.get('/library/stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = await Library.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Issue & Return
router.get('/library/issues', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const issues = await Library.findAllIssues(status ? { status } : {});
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issues' });
  }
});

router.get('/library/overdue', protect, adminOnly, async (req, res) => {
  try {
    const overdue = await Library.findOverdue();
    res.json(overdue);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overdue' });
  }
});

router.post('/library/issue', protect, adminOnly, async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  if (!bookId || !studentId || !dueDate) return res.status(400).json({ message: 'Book, student, and due date are required' });
  try {
    const issue = await Library.issueBook({ bookId, studentId, issuedBy: req.user.id, dueDate });
    res.status(201).json({ message: 'Book issued', issue });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error issuing book' });
  }
});

router.post('/library/return/:id', protect, adminOnly, async (req, res) => {
  try {
    const issue = await Library.returnBook(req.params.id);
    res.json({ message: `Book returned${issue.fineAmount > 0 ? `. Fine: ₹${issue.fineAmount}` : ''}`, issue });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error returning book' });
  }
});

export default router;
