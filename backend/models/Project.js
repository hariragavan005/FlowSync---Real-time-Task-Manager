const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteCode: { type: String, unique: true, uppercase: true },
  workflowType: {
    type: String,
    enum: ['Kanban', 'Sprint', 'Todo'],
    default: 'Kanban'
  },
  projectType: {
    type: String,
    enum: ['Software Development', 'College Project', 'Startup Workflow', 'Hackathon', 'Personal Productivity', 'Freelance Work'],
    default: 'Software Development'
  },
  teamSize: { type: String, default: '1-5' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
