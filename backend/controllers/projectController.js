const Project = require('../models/Project');

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

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

    // Emit activity event
    const io = req.app.get('io');
    io.emit('activity_event', {
      type: 'project_created', userName: req.user.name,
      message: `${req.user.name} created project "${name}"`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).populate('members', 'name email').populate('owner', 'name email');
    res.json(projects);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const joinProject = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });
    const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    if (!project) return res.status(404).json({ message: 'Invalid invite code. Project not found.' });
    const alreadyMember = project.members.some(m => m.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(200).json({ message: 'You are already a member.', project });
    project.members.push(req.user._id);
    await project.save();

    const io = req.app.get('io');
    io.to(project._id.toString()).emit('activity_event', {
      type: 'joined', userName: req.user.name,
      message: `${req.user.name} joined the project`,
      timestamp: new Date().toISOString()
    });

    const populated = await project.populate('members', 'name email');
    res.status(200).json({ message: 'Successfully joined the project!', project: populated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

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
    await project.save();

    // Kick the removed member's socket from the project room
    const io = req.app.get('io');
    io.to(project._id.toString()).emit('member_removed', { memberId, projectId: project._id.toString() });

    const populated = await project.populate('members', 'name email');
    res.json({ message: 'Member removed', project: populated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createProject, getProjects, joinProject, updateProject, deleteProject, removeMember };
