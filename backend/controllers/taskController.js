const Task = require('../models/Task');
const Project = require('../models/Project');
const { saveActivity } = require('./activityController');

// ── Create Task ───────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, dependencies } = req.body;

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title, description, project, assignee: assignee || null,
      priority: priority || 'Medium',
      dueDate: dueDate || undefined,
      dependencies: dependencies || []
    });

    const io = req.app.get('io');
    io.to(project.toString()).emit('task_created', task);
    const actMsg = `${req.user.name} created task "${title}"`;
    io.to(project.toString()).emit('activity_event', {
      type: 'task_created', userName: req.user.name,
      message: actMsg, timestamp: new Date().toISOString()
    });
    await saveActivity({ projectId: project, userId: req.user._id, userName: req.user.name, type: 'task_created', message: actMsg });

    if (priority === 'High' || priority === 'Highest') {
      io.to(project.toString()).emit('priority_alert', {
        message: `${priority} priority task created: ${title}`, task
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Tasks for a Project ───────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .populate('dependencies', 'title status');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Single Task ───────────────────────────────────────────────────────────
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('dependencies', 'title status');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Task Status (for drag & drop) ─────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id).populate('dependencies');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (status === 'Completed' && task.dependencies && task.dependencies.length > 0) {
      const incompleteDeps = task.dependencies.filter(dep => dep.status !== 'Completed');
      if (incompleteDeps.length > 0) {
        return res.status(400).json({
          message: 'Cannot complete task. Dependencies are not met.',
          incompleteDependencies: incompleteDeps.map(d => d.title)
        });
      }
    }

    task.status = status;
    const updatedTask = await task.save();

    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task_updated', updatedTask);
    if (status === 'Completed') {
      const actMsg = `${req.user.name} completed "${task.title}"`;
      io.to(task.project.toString()).emit('activity_event', {
        type: 'task_completed', userName: req.user.name,
        message: actMsg, timestamp: new Date().toISOString()
      });
      await saveActivity({ projectId: task.project, userId: req.user._id, userName: req.user.name, type: 'task_completed', message: actMsg });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Full Task Update ──────────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check user is a member of the project
    const proj = await Project.findById(task.project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const { title, description, assignee, priority, dueDate, dependencies, status } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (dependencies !== undefined) task.dependencies = dependencies;
    if (status !== undefined) task.status = status;

    const updatedTask = await task.save();
    await updatedTask.populate('assignee', 'name email');
    await updatedTask.populate('dependencies', 'title status');

    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task_updated', updatedTask);
    const actMsg2 = `${req.user.name} updated task "${updatedTask.title}"`;
    io.to(task.project.toString()).emit('activity_event', {
      type: 'task_updated', userName: req.user.name,
      message: actMsg2, timestamp: new Date().toISOString()
    });
    await saveActivity({ projectId: task.project, userId: req.user._id, userName: req.user.name, type: 'task_updated', message: actMsg2 });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delete Task ───────────────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only project owner or task assignee can delete
    const proj = await Project.findById(task.project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const isOwner = proj.owner.toString() === req.user._id.toString();
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    const isMember = proj.members.some(m => m.toString() === req.user._id.toString());

    // Any project member can delete tasks (project owner can always delete)
    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const projectId = task.project.toString();
    const taskTitle = task.title;
    await task.deleteOne();

    // Remove this task from other tasks' dependencies
    await Task.updateMany(
      { dependencies: req.params.id },
      { $pull: { dependencies: req.params.id } }
    );

    const io = req.app.get('io');
    io.to(projectId).emit('task_deleted', { taskId: req.params.id });
    const actMsg3 = `${req.user.name} deleted task "${taskTitle}"`;
    io.to(projectId).emit('activity_event', {
      type: 'task_deleted', userName: req.user.name,
      message: actMsg3, timestamp: new Date().toISOString()
    });
    await saveActivity({ projectId, userId: req.user._id, userName: req.user.name, type: 'task_deleted', message: actMsg3 });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Daily Stats ───────────────────────────────────────────────────────────────
const getDailyStats = async (req, res) => {
  try {
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] });
    const projectIds = projects.map(p => p._id);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [completed, pending, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds }, status: 'Completed', updatedAt: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $in: ['Pending', 'In Progress'] } }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Completed' }, dueDate: { $lt: today } }),
    ]);

    res.json({ completed, pending, overdue, activeProjects: projects.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createTask, getTasks, getTask, updateTaskStatus, updateTask, deleteTask, getDailyStats };
