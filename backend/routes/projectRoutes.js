const express = require('express');
const { createProject, getProjects, joinProject, updateProject, deleteProject, removeMember } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .post(protect, authorize('Admin'), createProject)
  .get(protect, getProjects);

router.post('/join', protect, joinProject);

router.route('/:id')
  .put(protect, authorize('Admin'), updateProject)
  .delete(protect, authorize('Admin'), deleteProject);

router.post('/:id/remove-member', protect, authorize('Admin'), removeMember);

module.exports = router;
