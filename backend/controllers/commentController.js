const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');

// ── Add Comment ───────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Verify commenter is a project member
    const proj = await Project.findById(task.project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const comment = await Comment.create({
      task: task._id,
      project: task.project,
      author: req.user._id,
      content: content.trim(),
    });
    await comment.populate('author', 'name avatarUrl');

    // Real-time: broadcast new comment to project room
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('comment_added', { taskId: task._id, comment });

    res.status(201).json(comment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Get Comments for a Task ───────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatarUrl');
    res.json(comments);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Delete Comment ────────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Only the comment author can delete
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the comment author can delete it' });

    await comment.deleteOne();
    const io = req.app.get('io');
    io.to(comment.project.toString()).emit('comment_deleted', {
      taskId: comment.task,
      commentId: comment._id,
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { addComment, getComments, deleteComment };
