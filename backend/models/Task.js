const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'To Do' },
  storyPoints: { type: Number, default: 0 },
  priority: {
    type: String,
    enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    default: 'Medium'
  },
  dueDate: { type: Date },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  isStarred: { type: Boolean, default: false },
  labels: [{
    text: { type: String, required: true },
    color: { type: String, default: '#10b981' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
