import express from 'express';
import FacultyTask from '../models/FacultyTask.js';
import TaskSubmission from '../models/TaskSubmission.js';
import User from '../models/User.js';
import { protect, adminOnly, facultyOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// ──────────────────────────────────────────────
// ADMIN: Create a new task
// POST /api/tasks
// ──────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, description, taskType, deadline, assignedTo, targetAll } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ message: 'Title, description, and deadline are required.' });
  }

  try {
    const task = await FacultyTask.create({
      title: String(title).trim(),
      description: String(description).trim(),
      taskType: taskType || 'General',
      deadline: new Date(deadline),
      assignedBy: req.user.id,
      assignedTo: targetAll ? [] : (assignedTo || []),
      targetAll: Boolean(targetAll)
    });

    res.status(201).json({ message: 'Task assigned successfully.', task });
  } catch (error) {
    console.error('[Create Task Error]', error);
    res.status(500).json({ message: 'Error creating task.' });
  }
});

// ──────────────────────────────────────────────
// ADMIN + FACULTY: List tasks
// GET /api/tasks
// ──────────────────────────────────────────────
router.get('/', protect, facultyOrAdmin, async (req, res) => {
  try {
    let tasks;

    if (req.user.role === 'faculty') {
      // Use SQL-native findForFaculty (handles targetAll OR assignedTo)
      tasks = await FacultyTask.findForFaculty(req.user.id);
    } else {
      // Admin sees all tasks
      tasks = await FacultyTask.find();
    }

    // Attach submission info for each task
    const taskIds = tasks.map(t => t._id);
    const submissions = await TaskSubmission.findByTaskIds(taskIds);

    const tasksWithSubmissions = tasks.map(task => ({
      ...task,
      submissions: submissions.filter(s => String(s.taskId) === String(task._id))
    }));

    res.json(tasksWithSubmissions);
  } catch (error) {
    console.error('[List Tasks Error]', error);
    res.status(500).json({ message: 'Error fetching tasks.' });
  }
});

// ──────────────────────────────────────────────
// ADMIN: Delete a task
// DELETE /api/tasks/:id
// ──────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const task = await FacultyTask.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Also remove associated submissions
    await TaskSubmission.deleteMany({ taskId: req.params.id });
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('[Delete Task Error]', error);
    res.status(500).json({ message: 'Error deleting task.' });
  }
});

// ──────────────────────────────────────────────
// FACULTY: Submit proof for a task
// POST /api/tasks/:id/submit
// ──────────────────────────────────────────────
router.post('/:id/submit', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can submit task proofs.' });
  }

  const { proofUrl, proofType, comments } = req.body;

  try {
    const task = await FacultyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Check if this faculty is assigned
    const isAssigned = task.targetAll || task.assignedTo.some(id => String(id) === req.user.id);
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task.' });
    }

    // Check for existing submission
    let existing = await TaskSubmission.findOne({ facultyId: req.user.id, taskId: req.params.id });
    if (existing) {
      // Update existing submission using save helper
      existing.proofUrl = proofUrl || existing.proofUrl;
      existing.proofType = proofType || existing.proofType;
      existing.comments = comments || existing.comments;
      existing.status = 'Pending'; // Reset to pending on re-submit
      existing = await TaskSubmission.save(existing);
      return res.json({ message: 'Submission updated.', submission: existing });
    }

    const submission = await TaskSubmission.create({
      facultyId: req.user.id,
      taskId: req.params.id,
      proofUrl: proofUrl || '',
      proofType: proofType || 'link',
      comments: comments || '',
      status: 'Pending'
    });

    res.status(201).json({ message: 'Task submitted successfully.', submission });
  } catch (error) {
    console.error('[Submit Task Error]', error);
    res.status(500).json({ message: 'Error submitting task.' });
  }
});

// ──────────────────────────────────────────────
// ADMIN: Grade/review a submission
// PUT /api/tasks/submissions/:id
// ──────────────────────────────────────────────
router.put('/submissions/:id', protect, adminOnly, async (req, res) => {
  const { status, qualityScore, adminFeedback } = req.body;

  try {
    let submission = await TaskSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    if (status) submission.status = status;
    if (qualityScore !== undefined) submission.qualityScore = Math.min(100, Math.max(0, Number(qualityScore)));
    if (adminFeedback !== undefined) submission.adminFeedback = String(adminFeedback).trim();

    submission = await TaskSubmission.save(submission);

    res.json({ message: 'Submission reviewed.', submission });
  } catch (error) {
    console.error('[Grade Submission Error]', error);
    res.status(500).json({ message: 'Error grading submission.' });
  }
});

export default router;
