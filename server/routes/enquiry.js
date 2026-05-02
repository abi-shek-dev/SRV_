import express from 'express';
import bcrypt from 'bcryptjs';
import Enquiry from '../models/Enquiry.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { buildParentDisplayName } from '../utils/parentProfile.js';
import { normalizeParentMobileNumber } from '../utils/parentContact.js';

const router = express.Router();

// ────────────────────────────────────────────────────
// Lead Scoring Engine
// ────────────────────────────────────────────────────
const calculateLeadScore = (enquiry) => {
  let score = 0;
  const interestMap = { Interested: 30, Contacted: 20, New: 15, 'Not Interested': 5, Converted: 0 };
  score += interestMap[enquiry.status] || 10;

  const demandBonus = { CDC: 10, SUITS: 10, 'SRV Skill Development': 8, General: 5 };
  score += demandBonus[enquiry.programInterest] || 5;

  if (enquiry.interactions && enquiry.interactions.length > 0) {
    const firstInteraction = enquiry.interactions[0];
    const hoursAfterCreation = (new Date(firstInteraction.createdAt) - new Date(enquiry.createdAt)) / (1000 * 60 * 60);
    if (hoursAfterCreation <= 24) score += 15;
    else if (hoursAfterCreation <= 48) score += 10;
    else score += 5;
    score += Math.min(enquiry.interactions.length * 3, 15);
  }

  if (enquiry.referredBy) score += 10;
  if (enquiry.studentName && enquiry.parentMobile && enquiry.grade) score += 10;
  score = Math.min(100, score);

  let temperature = 'Cold';
  if (score >= 65) temperature = 'Hot';
  else if (score >= 40) temperature = 'Warm';

  return { score, temperature };
};

// POST /api/enquiry — Create new enquiry
router.post('/', protect, adminOnly, async (req, res) => {
  const {
    studentName, parentName, parentMobile, email,
    grade, section, dateOfBirth, address,
    motherName, fatherName, guardianName,
    source, programInterest, remarks, referredBy, nextFollowUp
  } = req.body;

  if (!studentName || !studentName.trim()) {
    return res.status(400).json({ message: 'Student name is required.' });
  }

  try {
    const enquiryData = {
      studentName: studentName.trim(), parentName: parentName?.trim() || '',
      parentMobile: parentMobile?.trim() || '', email: email?.trim() || '',
      grade: grade?.trim() || '', section: section?.trim() || '',
      dateOfBirth: dateOfBirth || undefined, address: address?.trim() || '',
      motherName: motherName?.trim() || '', fatherName: fatherName?.trim() || '',
      guardianName: guardianName?.trim() || '', source: source || 'Walk-in',
      programInterest: programInterest || 'General', remarks: remarks?.trim() || '',
      referredBy: referredBy || null, nextFollowUp: nextFollowUp || undefined,
      createdBy: req.user.id, status: 'New'
    };

    const { score, temperature } = calculateLeadScore(enquiryData);
    enquiryData.leadScore = score;
    enquiryData.leadTemperature = temperature;

    const enquiry = await Enquiry.create(enquiryData);
    res.status(201).json({ message: 'Enquiry recorded successfully.', enquiry });
  } catch (error) {
    console.error('[Create Enquiry Error]', error);
    res.status(500).json({ message: 'Error creating enquiry.' });
  }
});

// GET /api/enquiry — List enquiries (with filters + search)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, source, programInterest, search } = req.query;
    // Use SQL-native search (replaces $regex/$or)
    const enquiries = await Enquiry.findWithSearch({ status, source, programInterest, search });
    res.json(enquiries);
  } catch (error) {
    console.error('[List Enquiries Error]', error);
    res.status(500).json({ message: 'Error fetching enquiries.' });
  }
});

// GET /api/enquiry/stats — Analytics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Enquiry.countDocuments();
    const stats = await Enquiry.getStats();

    const countMap = {};
    for (const row of stats.countRows) countMap[row.status] = Number(row.cnt);

    const converted = countMap['Converted'] || 0;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    res.json({
      total,
      converted,
      newCount: countMap['New'] || 0,
      contacted: countMap['Contacted'] || 0,
      interested: countMap['Interested'] || 0,
      notInterested: countMap['Not Interested'] || 0,
      conversionRate,
      programBreakdown: stats.programBreakdown,
      sourceBreakdown: stats.sourceBreakdown,
      monthlyTrends: stats.monthlyTrends,
      temperatureBreakdown: stats.temperatureBreakdown
    });
  } catch (error) {
    console.error('[Enquiry Stats Error]', error);
    res.status(500).json({ message: 'Error fetching stats.' });
  }
});

// GET /api/enquiry/alerts — Stale enquiries
router.get('/alerts', protect, adminOnly, async (req, res) => {
  try {
    // SQL-native helpers replace $in/$or/$lt/$gte operators
    const [staleEnquiries, hotUncontacted, aging] = await Promise.all([
      Enquiry.findStale(48),
      Enquiry.findHotUncontacted(50),
      Enquiry.findAging(7)
    ]);

    res.json({
      staleEnquiries,
      hotUncontacted,
      aging,
      totalAlerts: staleEnquiries.length + hotUncontacted.length + aging.length
    });
  } catch (error) {
    console.error('[Enquiry Alerts Error]', error);
    res.status(500).json({ message: 'Error fetching alerts.' });
  }
});

// PUT /api/enquiry/:id — Update enquiry
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    const updatable = [
      'studentName', 'parentName', 'parentMobile', 'email',
      'grade', 'section', 'dateOfBirth', 'address',
      'motherName', 'fatherName', 'guardianName',
      'source', 'programInterest', 'remarks', 'referredBy',
      'status', 'nextFollowUp'
    ];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) enquiry[field] = req.body[field];
    });

    const { score, temperature } = calculateLeadScore(enquiry);
    enquiry.leadScore = score;
    enquiry.leadTemperature = temperature;

    const updated = await Enquiry.save(enquiry);
    res.json({ message: 'Enquiry updated.', enquiry: updated });
  } catch (error) {
    console.error('[Update Enquiry Error]', error);
    res.status(500).json({ message: 'Error updating enquiry.' });
  }
});

// POST /api/enquiry/:id/interaction — Log interaction
router.post('/:id/interaction', protect, adminOnly, async (req, res) => {
  const { type, notes } = req.body;
  if (!type) return res.status(400).json({ message: 'Interaction type is required.' });

  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    // Use SQL addInteraction (replaces enquiry.interactions.push + enquiry.save)
    const updatedEnquiry = await Enquiry.addInteraction(req.params.id, {
      type, notes: notes?.trim() || '', by: req.user.id
    });

    // Update follow-up and status separately
    updatedEnquiry.lastFollowUp = new Date();
    updatedEnquiry.followUpCount = (enquiry.followUpCount || 0) + 1;
    if (enquiry.status === 'New') updatedEnquiry.status = 'Contacted';

    const { score, temperature } = calculateLeadScore(updatedEnquiry);
    updatedEnquiry.leadScore = score;
    updatedEnquiry.leadTemperature = temperature;

    const saved = await Enquiry.save(updatedEnquiry);
    res.json({ message: 'Interaction logged.', enquiry: saved });
  } catch (error) {
    console.error('[Log Interaction Error]', error);
    res.status(500).json({ message: 'Error logging interaction.' });
  }
});

// POST /api/enquiry/:id/convert — Convert to Admission
router.post('/:id/convert', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    if (enquiry.status === 'Converted') {
      return res.status(400).json({ message: 'This enquiry has already been converted.' });
    }
    if (!enquiry.studentName || !enquiry.grade) {
      return res.status(400).json({ message: 'Student name and grade are required to convert.' });
    }

    const motherName = enquiry.motherName || '';
    const fatherName = enquiry.fatherName || '';
    const guardianName = enquiry.guardianName || enquiry.parentName || '';
    const hasParents = Boolean(motherName && fatherName);
    const hasGuardian = Boolean(guardianName);

    if (!hasParents && !hasGuardian) {
      return res.status(400).json({ message: 'Family details required. Add mother+father names or a guardian name before converting.' });
    }

    const parentMobileNumber = normalizeParentMobileNumber(enquiry.parentMobile);

    // Generate SRV number using SQL-native helper
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
    const srvNumber = `${prefix}${sequence}`;

    const student = await Student.create({
      name: enquiry.studentName, srvNumber,
      grade: enquiry.grade, section: enquiry.section || 'A',
      motherName, fatherName, guardianName,
      parentMobileNumber, dateOfBirth: enquiry.dateOfBirth,
      address: enquiry.address, facultyId: null
    });

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const parentUser = await User.create({
      name: buildParentDisplayName(student, `Parent of ${enquiry.studentName}`),
      srvNumber: student.srvNumber, password: hashedPassword,
      role: 'parent', studentId: student._id, mobileNumber: parentMobileNumber
    });

    // Mark enquiry as converted using Enquiry.save()
    enquiry.status = 'Converted';
    enquiry.convertedStudentId = student._id;
    enquiry.convertedAt = new Date();
    enquiry.leadScore = 0;
    enquiry.leadTemperature = 'Hot';
    await Enquiry.save(enquiry);

    // Sync faculty mapping so the new student gets assigned to their class faculty immediately
    await Student.syncFacultyMappings();

    res.json({
      message: 'Enquiry converted to admission successfully!',
      student,
      parentLogin: { srvNumber: parentUser.srvNumber, defaultPassword }
    });
  } catch (error) {
    console.error('[Convert Enquiry Error]', error);
    res.status(500).json({ message: 'Error converting enquiry to admission.' });
  }
});

// DELETE /api/enquiry/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.json({ message: 'Enquiry deleted.' });
  } catch (error) {
    console.error('[Delete Enquiry Error]', error);
    res.status(500).json({ message: 'Error deleting enquiry.' });
  }
});

export default router;
