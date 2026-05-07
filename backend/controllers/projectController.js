const Project = require('../models/Project');
const Task = require('../models/Task');
const { saveActivity } = require('./activityController');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

/** Convert teamSize string → numeric cap (null = unlimited) */
const teamSizeCap = (teamSize) => {
  const map = { 'Solo': 1, '2-5': 5, '6-10': 10, '10+': null };
  return map[teamSize] ?? null;
};

// ── Create Project ────────────────────────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    let inviteCode, isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      if (!await Project.findOne({ inviteCode })) isUnique = true;
    }
    const { name, description, workflowType, projectType, teamSize } = req.body;
    const project = await new Project({
      name, description: description || '',
      owner: req.user._id, members: [req.user._id],
      inviteCode, workflowType, projectType, teamSize
    }).save();

    const io = req.app.get('io');
    const activityPayload = {
      type: 'project_created', userName: req.user.name,
      message: `${req.user.name} created project "${name}"`,
      timestamp: new Date().toISOString()
    };
    io.emit('activity_event', activityPayload);
    await saveActivity({ projectId: project._id, userId: req.user._id, userName: req.user.name, type: 'project_created', message: activityPayload.message });

    res.status(201).json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Get Projects ──────────────────────────────────────────────────────────────
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).populate('members', 'name email avatarUrl').populate('owner', 'name email avatarUrl');
    res.json(projects);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Join Project ──────────────────────────────────────────────────────────────
const joinProject = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    if (!project) return res.status(404).json({ message: 'Invalid invite code. Project not found.' });

    const alreadyMember = project.members.some(m => m.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(200).json({ message: 'You are already a member.', project });

    if (project.isLocked) {
      return res.status(403).json({ message: 'This project is locked. The owner must unlock it before new members can join.' });
    }

    const cap = teamSizeCap(project.teamSize);
    if (cap !== null && project.members.length >= cap) {
      return res.status(403).json({ message: `This project has reached its team size limit (${cap} members).` });
    }

    project.members.push(req.user._id);
    if (cap !== null && project.members.length >= cap) project.isLocked = true;
    await project.save();

    const io = req.app.get('io');
    const msg = `${req.user.name} joined the project`;
    io.to(project._id.toString()).emit('activity_event', {
      type: 'joined', userName: req.user.name, message: msg, timestamp: new Date().toISOString()
    });
    await saveActivity({ projectId: project._id, userId: req.user._id, userName: req.user.name, type: 'joined', message: msg });

    const populated = await project.populate('members', 'name email avatarUrl');
    res.status(200).json({ message: 'Successfully joined the project!', project: populated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Update Project ────────────────────────────────────────────────────────────
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the project owner can edit it' });
    project.name = req.body.name || project.name;
    project.description = req.body.description ?? project.description;
    await project.save();
    res.json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Delete Project ────────────────────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Remove Member ─────────────────────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the owner can remove members' });
    const { memberId } = req.body;
    if (memberId === project.owner.toString())
      return res.status(400).json({ message: 'Cannot remove the project owner' });

    project.members = project.members.filter(m => m.toString() !== memberId);
    const cap = teamSizeCap(project.teamSize);
    if (project.isLocked && cap !== null && project.members.length < cap) project.isLocked = false;
    await project.save();

    const io = req.app.get('io');
    io.to(project._id.toString()).emit('member_removed', { memberId, projectId: project._id.toString() });

    const populated = await project.populate('members', 'name email avatarUrl');
    res.json({ message: 'Member removed', project: populated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Toggle Lock ───────────────────────────────────────────────────────────────
const toggleLock = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the project owner can lock/unlock it' });

    project.isLocked = !project.isLocked;
    await project.save();

    const io = req.app.get('io');
    const msg = `${req.user.name} ${project.isLocked ? 'locked' : 'unlocked'} the project`;
    io.to(project._id.toString()).emit('activity_event', {
      type: project.isLocked ? 'project_locked' : 'project_unlocked',
      userName: req.user.name, message: msg, timestamp: new Date().toISOString()
    });
    await saveActivity({ projectId: project._id, userId: req.user._id, userName: req.user.name, type: project.isLocked ? 'project_locked' : 'project_unlocked', message: msg });

    const populated = await project.populate('members', 'name email avatarUrl').then(() => project.populate('owner', 'name email avatarUrl'));
    res.json({ message: `Project ${project.isLocked ? 'locked' : 'unlocked'}`, project: populated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Per-Project Stats ─────────────────────────────────────────────────────────
const getProjectStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name avatarUrl');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Verify requester is a member
    const isMember = project.members.some(m => (m._id || m).toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isMember && !isOwner) return res.status(403).json({ message: 'Not authorized' });

    const tasks = await Task.find({ project: req.params.id }).populate('assignee', 'name');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < today).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Member-wise task distribution
    const memberStats = project.members.map(member => {
      const memberId = (member._id || member).toString();
      const assigned = tasks.filter(t => t.assignee && (t.assignee._id || t.assignee).toString() === memberId);
      return {
        _id: memberId,
        name: member.name,
        avatarUrl: member.avatarUrl,
        total: assigned.length,
        completed: assigned.filter(t => t.status === 'Completed').length,
        inProgress: assigned.filter(t => t.status === 'In Progress').length,
        pending: assigned.filter(t => t.status === 'Pending').length,
      };
    });

    // Priority breakdown
    const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'].map(p => ({
      priority: p,
      count: tasks.filter(t => t.priority === p).length,
    }));

    res.json({
      projectId: req.params.id,
      projectName: project.name,
      total, completed, inProgress, pending, overdue, completionRate,
      memberStats, priorities,
      teamSize: project.members.length,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createProject, getProjects, joinProject, updateProject,
  deleteProject, removeMember, toggleLock, getProjectStats
};
