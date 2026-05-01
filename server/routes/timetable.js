import express from 'express';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/timetable/:grade/:section
// @desc    Get weekly timetable for a class (any authenticated user)
// @access  Private
router.get('/:grade/:section', protect, async (req, res) => {
  try {
    const periods = await Timetable.findByClass(req.params.grade, req.params.section);
    // Group by day for frontend convenience
    const grouped = {};
    periods.forEach(p => {
      if (!grouped[p.dayOfWeek]) grouped[p.dayOfWeek] = [];
      grouped[p.dayOfWeek].push(p);
    });
    res.json({ periods, grouped });
  } catch (error) {
    console.error('[Timetable Fetch]', error);
    res.status(500).json({ message: 'Error fetching timetable' });
  }
});

// @route   GET /api/timetable/today/:grade/:section
// @desc    Get today's schedule for a class
// @access  Private
router.get('/today/:grade/:section', protect, async (req, res) => {
  try {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = days[new Date().getDay()];
    const periods = await Timetable.findByClassAndDay(req.params.grade, req.params.section, today);
    res.json({ day: today, periods });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today\'s schedule' });
  }
});

// @route   POST /api/timetable
// @desc    Bulk upsert timetable for a class (admin only)
// @access  Private (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  const { grade, section, periods } = req.body;
  if (!grade || !section) return res.status(400).json({ message: 'Grade and section are required.' });
  if (!Array.isArray(periods)) return res.status(400).json({ message: 'Periods must be an array.' });
  try {
    const result = await Timetable.bulkUpsert(grade, section, periods);
    res.json({ message: `Timetable saved with ${result.count} period(s).`, ...result });
  } catch (error) {
    console.error('[Timetable Save]', error);
    res.status(500).json({ message: 'Error saving timetable' });
  }
});

// @route   DELETE /api/timetable/:grade/:section
// @desc    Clear timetable for a class (admin only)
// @access  Private (Admin)
router.delete('/:grade/:section', protect, adminOnly, async (req, res) => {
  try {
    const result = await Timetable.deleteByClass(req.params.grade, req.params.section);
    res.json({ message: `Timetable cleared. ${result.deleted} period(s) removed.` });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing timetable' });
  }
});

export default router;
