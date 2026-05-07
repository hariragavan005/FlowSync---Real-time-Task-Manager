const ActivityLog = require('../models/ActivityLog');

/**
 * Save an activity event to the database.
 * Used internally by other controllers — not a route handler.
 */
const saveActivity = async ({ projectId, userId, userName, type, message }) => {
  try {
    await ActivityLog.create({ project: projectId, user: userId, userName, type, message });
    // Trim to last 200 entries per project (fire-and-forget, non-blocking)
    ActivityLog.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(200)
      .select('_id')
      .then(old => {
        if (old.length > 0) ActivityLog.deleteMany({ _id: { $in: old.map(d => d._id) } }).exec();
      })
      .catch(() => {});
  } catch (_) {
    // Never crash a request just because logging failed
  }
};

/**
 * GET /projects/:id/activity
 * Returns the last 50 activity logs for a project (newest first).
 */
const getProjectActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ project: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name avatarUrl');
    res.json(logs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { saveActivity, getProjectActivity };
