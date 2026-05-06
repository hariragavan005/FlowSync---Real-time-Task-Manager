const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  priority: {
    type: String,
    enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    default: 'Medium'
  },
  dueDate: { type: Date },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
