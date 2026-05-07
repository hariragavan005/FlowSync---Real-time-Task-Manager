const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET/POST comments for a task
router.route('/tasks/:taskId/comments')
  .get(protect, getComments)
  .post(protect, addComment);

// DELETE a specific comment
router.delete('/tasks/:taskId/comments/:commentId', protect, deleteComment);

module.exports = router;
