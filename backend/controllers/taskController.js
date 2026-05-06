const Task = require('../models/Task');
const Project = require('../models/Project');

const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, dependencies } = req.body;
    
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title, description, project, assignee, priority, dueDate, dependencies
    });

    const io = req.app.get('io');
    io.to(project.toString()).emit('task_created', task);
    io.to(project.toString()).emit('activity_event', {
      type: 'task_created', userName: req.user.name,
      message: `${req.user.name} created task "${title}"`,
      timestamp: new Date().toISOString()
    });

    if (priority === 'High') {
      io.to(project.toString()).emit('priority_alert', {
        message: `High priority task created: ${title}`,
        task
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('dependencies');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      io.to(task.project.toString()).emit('activity_event', {
        type: 'task_completed', userName: req.user.name,
        message: `${req.user.name} completed "${task.title}"`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Daily stats for logged-in user across all their projects
const getDailyStats = async (req, res) => {
  try {
    const Project = require('../models/Project');
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

module.exports = { createTask, getTasks, updateTaskStatus, getDailyStats };
