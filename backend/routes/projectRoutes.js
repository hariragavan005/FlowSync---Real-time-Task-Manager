const express = require('express');
const {
  createProject, getProjects, joinProject,
  updateProject, deleteProject, removeMember,
  toggleLock, getProjectStats
} = require('../controllers/projectController');
const { getProjectActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, createProject)
  .get(protect, getProjects);

router.post('/join', protect, joinProject);

router.route('/:id')
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.post('/:id/remove-member', protect, removeMember);
router.put('/:id/lock', protect, toggleLock);
router.get('/:id/stats', protect, getProjectStats);
router.get('/:id/activity', protect, getProjectActivity);

module.exports = router;
