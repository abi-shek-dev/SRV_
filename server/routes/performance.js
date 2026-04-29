import express from 'express';
import User from '../models/User.js';
import FacultyTask from '../models/FacultyTask.js';
import TaskSubmission from '../models/TaskSubmission.js';
import StudentFeedback from '../models/StudentFeedback.js';
import ProgramContribution from '../models/ProgramContribution.js';
import { protect, facultyOrAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Performance Scoring Engine
 * Weights: 40% Task | 20% Quality | 20% Feedback | 20% Contribution
 */

const calculatePerformanceScore = async (facultyId) => {
  // ──── 1. Task Completion (40%) ────
  const allTasks = await FacultyTask.findForFaculty(facultyId);
  const totalTasks = allTasks.length;
  const taskIds = allTasks.map(t => t._id);

  const submissions = await TaskSubmission.findByTaskIds(taskIds);
  const mySubmissions = submissions.filter(s => String(s.facultyId) === String(facultyId));

  const approvedSubmissions = mySubmissions.filter(s => s.status === 'Approved');
  const taskScore = totalTasks > 0 ? (approvedSubmissions.length / totalTasks) * 100 : 0;

  // ──── 2. Quality Score (20%) ────
  const qualityScores = approvedSubmissions.map(s => s.qualityScore).filter(q => q > 0);
  const qualityScore = qualityScores.length > 0
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : 0;

  // ──── 3. Student Feedback (20%) ────
  const feedbacks = await StudentFeedback.find({ facultyId });
  let feedbackScore = 0;
  if (feedbacks.length > 0) {
    const avgRatings = feedbacks.reduce((acc, fb) => {
      acc.teaching += fb.ratings?.teachingQuality || 0;
      acc.communication += fb.ratings?.communication || 0;
      acc.support += fb.ratings?.support || 0;
      return acc;
    }, { teaching: 0, communication: 0, support: 0 });

    const avgOverall = (
      (avgRatings.teaching / feedbacks.length) +
      (avgRatings.communication / feedbacks.length) +
      (avgRatings.support / feedbacks.length)
    ) / 3;
    
    feedbackScore = (avgOverall / 5) * 100;
  }

  // ──── 4. Program Contribution (20%) ────
  const contributions = await ProgramContribution.find({ facultyId });
  let contributionScore = 0;
  if (contributions.length > 0) {
    const levelScores = { Active: 100, Moderate: 70, Low: 40, None: 0 };
    const totalContrib = contributions.reduce((acc, c) => acc + (levelScores[c.participationLevel] || 0), 0);
    contributionScore = totalContrib / contributions.length;
  }

  // ──── Final Weighted Score ────
  const finalScore = Math.round(
    (taskScore * 0.4) +
    (qualityScore * 0.2) +
    (feedbackScore * 0.2) +
    (contributionScore * 0.2)
  );

  // ──── Generate Alerts ────
  const alerts = [];
  if (totalTasks > 0 && (approvedSubmissions.length / totalTasks) < 0.5) {
    alerts.push({ type: 'LOW_TASK_COMPLETION', message: 'Task completion is below 50%. Consider following up.' });
  }
  if (mySubmissions.length > 0 && qualityScore < 40) {
    alerts.push({ type: 'LOW_QUALITY', message: 'Average quality score is below 40. Review submission standards.' });
  }
  if (feedbackScore > 0 && feedbackScore < 50) {
    alerts.push({ type: 'LOW_FEEDBACK', message: 'Student feedback rating is below average. Consider improvement steps.' });
  }

  return {
    taskScore: Math.round(taskScore),
    qualityScore: Math.round(qualityScore),
    feedbackScore: Math.round(feedbackScore),
    contributionScore: Math.round(contributionScore),
    finalScore,
    totalTasks,
    completedTasks: approvedSubmissions.length,
    pendingTasks: mySubmissions.filter(s => s.status === 'Pending').length,
    alerts
  };
};

// ──────────────────────────────────────────────
// GET /api/performance/leaderboard
// ──────────────────────────────────────────────
router.get('/leaderboard', protect, facultyOrAdmin, async (req, res) => {
  try {
    const allFaculty = await User.findByRole('faculty');

    const leaderboard = await Promise.all(
      allFaculty.map(async (faculty) => {
        const scores = await calculatePerformanceScore(faculty._id);
        return {
          _id: faculty._id,
          name: faculty.name,
          srvNumber: faculty.srvNumber,
          assignedGrade: faculty.assignedGrade,
          assignedSection: faculty.assignedSection,
          ...scores
        };
      })
    );

    leaderboard.sort((a, b) => b.finalScore - a.finalScore);
    leaderboard.forEach((entry, index) => { entry.rank = index + 1; });

    res.json(leaderboard);
  } catch (error) {
    console.error('[Leaderboard Error]', error);
    res.status(500).json({ message: 'Error generating leaderboard.' });
  }
});

// ──────────────────────────────────────────────
// GET /api/performance/me
// ──────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view their own performance.' });
  }

  try {
    const scores = await calculatePerformanceScore(req.user.id);
    res.json(scores);
  } catch (error) {
    console.error('[My Performance Error]', error);
    res.status(500).json({ message: 'Error fetching performance data.' });
  }
});

export default router;
