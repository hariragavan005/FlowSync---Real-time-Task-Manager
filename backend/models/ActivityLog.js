const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:  { type: String, required: true },
  type:      { type: String, required: true },  // e.g. task_created, task_completed, joined …
  message:   { type: String, required: true },
}, { timestamps: true });

// Keep only last 200 logs per project (TTL-style via hooks is complex — use a cap in the controller)
module.exports = mongoose.model('ActivityLog', activityLogSchema);
