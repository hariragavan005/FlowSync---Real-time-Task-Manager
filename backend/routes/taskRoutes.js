const express = require('express');
const { createTask, getTasks, getTask, updateTaskStatus, updateTask, deleteTask, getDailyStats } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Stats — must be before /:id to avoid route conflict
router.get('/stats/daily', protect, getDailyStats);

// Collection routes
router.route('/')
  .post(protect, createTask);

router.route('/project/:projectId')
  .get(protect, getTasks);

// Single-task routes
router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

// Status-only update (for drag & drop)
router.route('/:id/status')
  .put(protect, updateTaskStatus);

module.exports = router;
