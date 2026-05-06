import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import PresenceBar from '../dashboard/PresenceBar';
import ActivityFeed from '../dashboard/ActivityFeed';
import {
  PlusIcon, ArrowLeftIcon, FlagIcon, CalendarIcon,
  ExclamationTriangleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

// ─── Priority Config ───────────────────────────────────────────────────────
const PRIORITIES = [
  { id: 'Highest', label: 'Highest', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-200', bar: 'border-l-red-500' },
  { id: 'High',    label: 'High',    dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'border-l-orange-400' },
  { id: 'Medium',  label: 'Medium',  dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', bar: 'border-l-yellow-400' },
  { id: 'Low',     label: 'Low',     dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'border-l-blue-400' },
  { id: 'Lowest',  label: 'Lowest',  dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500 border-gray-200',       bar: 'border-l-gray-300' },
];
const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[2];

// ─── Column Config ─────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Pending',     label: 'To Do',       accent: 'bg-slate-100', dot: 'bg-gray-400' },
  { id: 'In Progress', label: 'In Progress',  accent: 'bg-blue-50',  dot: 'bg-blue-500' },
  { id: 'Completed',   label: 'Done',         accent: 'bg-emerald-50',dot: 'bg-emerald-500' },
];

// ─── Task Card ─────────────────────────────────────────────────────────────
const KanbanCard = ({ task, provided }) => {
  const p = getPriority(task.priority);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${p.bar} p-3.5 mb-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all`}
    >
      <p className="text-sm font-semibold text-gray-800 mb-2 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </span>
        {isOverdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> Overdue
          </span>
        )}
        {task.dueDate && !isOverdue && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <CalendarIcon className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.dependencies?.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">{task.dependencies.length} dep</span>
        )}
      </div>
    </div>
  );
};

// ─── Main Board ────────────────────────────────────────────────────────────
const TaskBoard = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ Pending: [], 'In Progress': [], Completed: [] });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [activityEvents, setActivityEvents] = useState([]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/project/${projectId}`);
      const grouped = { Pending: [], 'In Progress': [], Completed: [] };
      data.forEach(t => grouped[t.status]?.push(t));
      setTasks(grouped);
    } catch { showPriorityAlert('Error fetching tasks', 'high'); }
  }, [projectId]);

  // Fetch project info
  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProject(data.find(p => p._id === projectId)))
      .catch(() => {});
    fetchTasks();
  }, [fetchTasks, projectId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_project', { projectId, userId: user?._id, userName: user?.name });

    const onCreated = (t) => setTasks(prev => ({ ...prev, [t.status]: [...prev[t.status], t] }));
    const onUpdated = (t) => setTasks(prev => {
      const next = { Pending: prev.Pending.filter(x => x._id !== t._id), 'In Progress': prev['In Progress'].filter(x => x._id !== t._id), Completed: prev.Completed.filter(x => x._id !== t._id) };
      next[t.status] = [...next[t.status], t];
      return next;
    });
    const onAlert = (d) => showPriorityAlert(d.message, 'high');
    const onActivity = (e) => setActivityEvents(prev => [e, ...prev].slice(0, 20));
    // Kick handler — if this user is removed, redirect to dashboard
    const onMemberRemoved = ({ memberId }) => {
      if (memberId === user?._id) {
        showPriorityAlert('You have been removed from this project.', 'high');
        navigate('/dashboard');
      }
    };

    socket.on('task_created', onCreated);
    socket.on('task_updated', onUpdated);
    socket.on('priority_alert', onAlert);
    socket.on('activity_event', onActivity);
    socket.on('member_removed', onMemberRemoved);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created', onCreated);
      socket.off('task_updated', onUpdated);
      socket.off('priority_alert', onAlert);
      socket.off('activity_event', onActivity);
      socket.off('member_removed', onMemberRemoved);
    };
  }, [socket, projectId, user, navigate]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/tasks', { title, project: projectId, priority, dueDate: dueDate || undefined, assignee: user._id });
      setTitle(''); setDueDate(''); setAddOpen(false);
    } catch (err) { showPriorityAlert(err.response?.data?.message || 'Error creating task', 'high'); }
  };

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return;
    try { await api.put(`/tasks/${draggableId}/status`, { status: destination.droppableId }); }
    catch (err) { showPriorityAlert(err.response?.data?.message || 'Error moving task', 'high'); }
  };

  const totalTasks = Object.values(tasks).flat().length;
  const completedCount = tasks.Completed.length;
  const health = totalTasks === 0 ? 100 : Math.round((completedCount / totalTasks) * 100);
  const overdueCount = Object.values(tasks).flat().filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
  const healthStatus = overdueCount > 2 || health < 30 ? { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' } : health < 60 ? { label: 'At Risk', color: 'text-amber-600 bg-amber-50 border-amber-200' } : { label: 'Healthy', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-emerald-100/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-teal-100/15 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition">
                <ArrowLeftIcon className="w-4 h-4" /> Dashboard
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-semibold text-gray-700">{project?.name || 'Project Board'}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{project?.name || 'Project Board'}</h1>
              {project?.workflowType && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{project.workflowType}</span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${healthStatus.color}`}>
                {healthStatus.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <PresenceBar projectId={projectId} />
            {user?.role === 'Admin' && (
              <motion.button onClick={() => setAddOpen(v => !v)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
                <PlusIcon className="w-4 h-4" /> Add Task
              </motion.button>
            )}
          </div>
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {addOpen && user?.role === 'Admin' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5">
              <form onSubmit={handleCreateTask}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Design homepage layout"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-semibold">
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-medium" />
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md">
                  Create Task
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board + Sidebar */}
        <div className="flex flex-col xl:flex-row gap-5">
          {/* Kanban Board */}
          <div className="flex-1 min-w-0">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMNS.map(col => (
                  <div key={col.id} className={`rounded-2xl ${col.accent} p-4 min-h-[480px] flex flex-col`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">{col.label}</h3>
                      <span className="ml-auto text-xs font-bold text-gray-400 bg-white/60 px-2 py-0.5 rounded-full">
                        {tasks[col.id]?.length || 0}
                      </span>
                    </div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-100/40' : ''}`}>
                          {tasks[col.id]?.map((task, i) => (
                            <Draggable key={task._id} draggableId={task._id} index={i}>
                              {(prov) => <KanbanCard task={task} provided={prov} />}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {tasks[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-24 text-xs text-gray-300 font-semibold">
                              Drop tasks here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>

          {/* Sidebar: Activity */}
          <div className="xl:w-64 flex-shrink-0">
            <ActivityFeed projectId={projectId} initialEvents={activityEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
