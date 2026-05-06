const express = require('express');
const { createTask, getTasks, updateTaskStatus, getDailyStats } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, createTask);

router.route('/project/:projectId')
  .get(protect, getTasks);

router.route('/:id/status')
  .put(protect, updateTaskStatus);

router.get('/stats/daily', protect, getDailyStats);

module.exports = router;
