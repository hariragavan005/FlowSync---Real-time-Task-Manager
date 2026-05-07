import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import PresenceBar from '../dashboard/PresenceBar';
import ActivityFeed from '../dashboard/ActivityFeed';
import TaskEditModal from './TaskEditModal';
import TaskCommentsPanel from './TaskCommentsPanel';
import {
  PlusIcon, ArrowLeftIcon, CalendarIcon,
  ExclamationTriangleIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  ChatBubbleLeftEllipsisIcon, EllipsisVerticalIcon, StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { CheckIcon, StarIcon as StarIconSolid, TagIcon } from '@heroicons/react/24/solid';

// ─── Priority Config ────────────────────────────────────────────────────────
const PRIORITIES = [
  { id: 'Highest', label: 'Highest', dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',       bar: 'border-l-red-500' },
  { id: 'High',    label: 'High',    dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'border-l-orange-400' },
  { id: 'Medium',  label: 'Medium',  dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', bar: 'border-l-yellow-400' },
  { id: 'Low',     label: 'Low',     dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'border-l-blue-400' },
  { id: 'Lowest',  label: 'Lowest',  dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500 border-gray-200',       bar: 'border-l-gray-300' },
];
const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[2];

// ─── Column Config ──────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Pending',     label: 'To Do',      accent: 'bg-slate-100',    dot: 'bg-gray-400' },
  { id: 'In Progress', label: 'In Progress', accent: 'bg-blue-50',     dot: 'bg-blue-500' },
  { id: 'Completed',   label: 'Done',        accent: 'bg-emerald-50',  dot: 'bg-emerald-500' },
];

// ─── Confirm Delete Modal ───────────────────────────────────────────────────
const DeleteConfirmModal = ({ isOpen, taskTitle, onConfirm, onCancel }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full z-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrashIcon className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Task?</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            "<span className="font-semibold text-gray-700">{taskTitle}</span>" will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition">
              Delete
            </button>
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Task Card ──────────────────────────────────────────────────────────────
const KanbanCard = ({ task, provided, onEdit, onDelete, onComment, onUpdateTask, unreadCount, projectWorkflowType }) => {
  const p = getPriority(task.priority);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const [showActions, setShowActions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelText, setEditingLabelText] = useState('');

  const handleMouseLeave = () => {
    setShowActions(false);
    setMenuOpen(false);
    setEditingLabelId(null);
  };

  const handleAddLabel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newLabelText.trim()) return;
    const updatedLabels = [...(task.labels || []), { text: newLabelText.trim() }];
    onUpdateTask(task._id, { labels: updatedLabels });
    setNewLabelText('');
  };

  const handleDeleteLabel = (e, labelId) => {
    e.stopPropagation();
    const updatedLabels = (task.labels || []).filter(l => l._id !== labelId);
    onUpdateTask(task._id, { labels: updatedLabels });
  };

  const handleSaveEditLabel = (e, labelId) => {
    e.stopPropagation();
    if (!editingLabelText.trim()) return;
    const updatedLabels = (task.labels || []).map(l =>
      l._id === labelId ? { ...l, text: editingLabelText.trim() } : l
    );
    onUpdateTask(task._id, { labels: updatedLabels });
    setEditingLabelId(null);
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100/80 border-l-4 ${p.bar} p-4 mb-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top badges & actions row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Render custom labels as modern, pill tags */}
        <div className="flex flex-wrap gap-1 items-center max-w-[75%]">
          {task.labels && task.labels.length > 0 ? (
            task.labels.map(l => (
              <span
                key={l._id || l.text}
                className="inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 uppercase tracking-wider"
              >
                {l.text}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-gray-300 font-bold tracking-wider uppercase">Task</span>
          )}
        </div>

        {/* Action icons / Ellipsis 3-dots Menu Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0 relative">
          {/* Comments icon with WhatsApp style notification bubble */}
          <button
            onClick={(e) => { e.stopPropagation(); onComment(task); }}
            title="Comments"
            className="relative p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
          >
            <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 3 dots menu button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            title="Task Menu"
            className={`p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition ${showActions || menuOpen ? 'opacity-100' : 'opacity-0'}`}
          >
            <EllipsisVerticalIcon className="w-3.5 h-3.5" />
          </button>

          {/* Elegant Dropdown Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute right-0 top-7 w-52 bg-white/95 backdrop-blur-2xl border border-gray-100/80 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Star / Unstar Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask(task._id, { isStarred: !task.isStarred });
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <span className="flex items-center gap-2">
                    {task.isStarred ? (
                      <StarIconSolid className="w-4 h-4 text-amber-500 animate-pulse" />
                    ) : (
                      <StarIconOutline className="w-4 h-4 text-gray-400" />
                    )}
                    {task.isStarred ? 'Starred Task' : 'Star Task'}
                  </span>
                  {task.isStarred && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Active</span>}
                </button>

                {/* Edit & Delete Shortcuts inside Menu */}
                <div className="grid grid-cols-2 gap-1.5 border-t border-b border-gray-50 py-1.5">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(task); }}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                  >
                    <PencilSquareIcon className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(task); }}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition"
                  >
                    <TrashIcon className="w-3 h-3" /> Delete
                  </button>
                </div>

                {/* Sprint Estimation Selection (Visible if project is a Sprint workflow) */}
                {projectWorkflowType === 'Sprint' && (
                  <div className="border-t border-gray-50 pt-2 flex flex-col gap-1.5 px-1">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Estimate Effort</span>
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {[1, 2, 3, 5, 8, 13].map(pts => (
                        <button
                          key={pts}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTask(task._id, { storyPoints: task.storyPoints === pts ? 0 : pts });
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold transition flex-shrink-0 ${
                            task.storyPoints === pts
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                          }`}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Labels Management Header */}
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1">
                  <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>Manage Labels</span>
                </div>

                {/* Inline Labels List */}
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-0.5">
                  {task.labels && task.labels.length > 0 ? (
                    task.labels.map(l => (
                      <div
                        key={l._id || l.text}
                        className="group/tag flex items-center justify-between px-2 py-1 rounded-lg bg-gray-50 hover:bg-emerald-50/50 text-[10px] font-semibold text-gray-600 transition"
                      >
                        {editingLabelId === l._id ? (
                          <input
                            type="text"
                            value={editingLabelText}
                            onChange={(e) => setEditingLabelText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditLabel(e, l._id);
                              if (e.key === 'Escape') setEditingLabelId(null);
                            }}
                            className="w-24 bg-white border border-emerald-300 outline-none rounded px-1 text-[10px]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => {
                              setEditingLabelId(l._id);
                              setEditingLabelText(l.text);
                            }}
                            className="truncate cursor-pointer hover:text-emerald-700"
                            title="Double click to edit"
                          >
                            {l.text}
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {editingLabelId === l._id ? (
                            <button
                              onClick={(e) => handleSaveEditLabel(e, l._id)}
                              className="text-emerald-600 hover:text-emerald-800 p-0.5"
                            >
                              <CheckIcon className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLabelId(l._id);
                                  setEditingLabelText(l.text);
                                }}
                                className="text-gray-400 hover:text-emerald-600 p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              >
                                <PencilSquareIcon className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteLabel(e, l._id)}
                                className="text-gray-400 hover:text-red-500 p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-300 italic px-2">No labels configured</span>
                  )}
                </div>

                {/* Add New Label Form inside Menu */}
                <form onSubmit={handleAddLabel} className="flex gap-1 border-t border-gray-50 pt-2">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-2 py-1 rounded-lg bg-gray-50 border border-transparent focus:border-emerald-300 focus:bg-white text-[10px] font-medium outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold shadow-sm"
                  >
                    Add
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Title & Star row */}
      <div className="flex items-start gap-1.5 mb-2">
        {task.isStarred && (
          <StarIconSolid className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.3)] animate-pulse" />
        )}
        <p className="text-sm font-bold text-gray-800 leading-snug flex-1">{task.title}</p>
      </div>

      {/* Task description snippet */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-2.5 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Meta badges row */}
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50/80">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </span>

        {task.storyPoints > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            {task.storyPoints} SP
          </span>
        )}

        {isOverdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> Overdue
          </span>
        )}

        {task.dueDate && !isOverdue && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <CalendarIcon className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {task.assignee?.name && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium ml-auto">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 text-white text-[8px] font-bold flex items-center justify-center">
              {task.assignee.name.charAt(0).toUpperCase()}
            </span>
            {task.assignee.name.split(' ')[0]}
          </span>
        )}

        {task.dependencies?.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
            {task.dependencies.length} dep
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Board ─────────────────────────────────────────────────────────────
const TaskBoard = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({});
  const [activityEvents, setActivityEvents] = useState([]);

  // Add-task form
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  // Edit modal
  const [editTask, setEditTask] = useState(null);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentTask, setCommentTask] = useState(null);

  // Unread comments notification state
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(`unread_comments_${projectId}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const commentTaskRef = useRef(commentTask);
  useEffect(() => {
    commentTaskRef.current = commentTask;
  }, [commentTask]);

  // Dynamically resolve columns/stages list based on project settings
  const getColumnsList = useCallback(() => {
    if (project?.columns && project.columns.length > 0) return project.columns;
    if (project?.workflowType === 'Todo') return ['To Do', 'Done'];
    return ['To Do', 'In Progress', 'Done'];
  }, [project]);

  // Map column names to visual configs (dot colors, background accents) dynamically
  const getDynamicColumnConfig = useCallback(() => {
    const list = getColumnsList();
    return list.map((colName, idx) => {
      if (idx === 0) {
        return { id: colName, label: colName, accent: 'bg-slate-100', dot: 'bg-gray-400' };
      }
      if (idx === list.length - 1) {
        return { id: colName, label: colName, accent: 'bg-emerald-50', dot: 'bg-emerald-500' };
      }
      const intermediateStyles = [
        { accent: 'bg-blue-50',     dot: 'bg-blue-500' },
        { accent: 'bg-amber-50',    dot: 'bg-amber-500' },
        { accent: 'bg-indigo-50',   dot: 'bg-indigo-500' },
        { accent: 'bg-purple-50',   dot: 'bg-purple-500' },
        { accent: 'bg-rose-50',     dot: 'bg-rose-500' },
        { accent: 'bg-teal-50',     dot: 'bg-teal-500' },
      ];
      const style = intermediateStyles[(idx - 1) % intermediateStyles.length];
      return { id: colName, label: colName, ...style };
    });
  }, [getColumnsList]);

  // Retrieve WIP limit constraints for a given column stage
  const getWIPLimit = useCallback((colId) => {
    if (project?.workflowType === 'Kanban') {
      const list = getColumnsList();
      if (list[1] === colId) return 3;
    }
    return 0;
  }, [project, getColumnsList]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/project/${projectId}`);
      const columnsList = getColumnsList();
      const grouped = {};
      columnsList.forEach(col => {
        grouped[col] = [];
      });

      data.forEach(t => {
        // Fallback status if database status is obsolete/missing in current project stages list
        const status = columnsList.includes(t.status) ? t.status : columnsList[0];
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(t);
      });
      setTasks(grouped);
    } catch { showPriorityAlert('Error fetching tasks', 'high'); }
  }, [projectId, getColumnsList]);

  // Fetch project info (for members list in edit modal)
  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => {
        const proj = data.find(p => p._id === projectId);
        setProject(proj);
      })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_project', { projectId, userId: user?._id, userName: user?.name });

    const onCreated = (t) => setTasks(prev => {
      const columnsList = getColumnsList();
      const status = columnsList.includes(t.status) ? t.status : columnsList[0];
      const col = prev[status] || [];
      return { ...prev, [status]: [...col, t] };
    });

    const onUpdated = (t) => setTasks(prev => {
      const columnsList = getColumnsList();
      const status = columnsList.includes(t.status) ? t.status : columnsList[0];
      const next = {};
      Object.keys(prev).forEach(colName => {
        next[colName] = (prev[colName] || []).filter(x => x._id !== t._id);
      });

      const targetCol = prev[status] || [];
      const index = targetCol.findIndex(x => x._id === t._id);
      const nextTargetCol = [...(next[status] || [])];
      
      if (index !== -1) {
        nextTargetCol.splice(index, 0, t);
        next[status] = nextTargetCol;
      } else {
        next[status] = [...nextTargetCol, t];
      }
      return next;
    });

    const onDeleted = ({ taskId }) => setTasks(prev => {
      const next = {};
      Object.keys(prev).forEach(colName => {
        next[colName] = (prev[colName] || []).filter(t => t._id !== taskId);
      });
      return next;
    });

    const onAlert = (d) => showPriorityAlert(d.message, 'high');
    const onActivity = (e) => setActivityEvents(prev => [e, ...prev].slice(0, 20));

    const onMemberRemoved = ({ memberId }) => {
      if (memberId === user?._id) {
        showPriorityAlert('You have been removed from this project.', 'high');
        navigate('/dashboard');
      }
    };

    const onCommentAdded = ({ taskId, comment }) => {
      if (comment.author?._id === user?._id || comment.author === user?._id) return;
      setUnreadCounts(prev => {
        if (commentTaskRef.current?._id === taskId) return prev;
        const updated = { ...prev, [taskId]: (prev[taskId] || 0) + 1 };
        localStorage.setItem(`unread_comments_${projectId}`, JSON.stringify(updated));
        return updated;
      });
    };

    socket.on('task_created', onCreated);
    socket.on('task_updated', onUpdated);
    socket.on('task_deleted', onDeleted);
    socket.on('priority_alert', onAlert);
    socket.on('activity_event', onActivity);
    socket.on('member_removed', onMemberRemoved);
    socket.on('comment_added', onCommentAdded);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created', onCreated);
      socket.off('task_updated', onUpdated);
      socket.off('task_deleted', onDeleted);
      socket.off('priority_alert', onAlert);
      socket.off('activity_event', onActivity);
      socket.off('member_removed', onMemberRemoved);
      socket.off('comment_added', onCommentAdded);
    };
  }, [socket, projectId, user, navigate]);

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/tasks', {
        title,
        project: projectId,
        priority,
        dueDate: dueDate || undefined,
        assignee: user._id,
      });
      setTitle(''); setDueDate(''); setAddOpen(false);
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Error creating task', 'high');
    }
  };

  // Drag & drop — status change with Optimistic UI updates for zero-lag drag-and-drop
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    // Find task in source column
    const taskToMove = tasks[sourceCol]?.find(t => t._id === draggableId);
    if (!taskToMove) return;

    // Build the updated task object
    const updatedTask = { ...taskToMove, status: destCol };

    // Synchronously update local tasks state for instant butter-smooth UI transition
    setTasks(prev => {
      const next = {};
      Object.keys(prev).forEach(colName => {
        next[colName] = (prev[colName] || []).filter(x => x._id !== draggableId);
      });

      const destList = [...(next[destCol] || [])];
      destList.splice(destination.index, 0, updatedTask);
      next[destCol] = destList;
      return next;
    });

    try {
      await api.put(`/tasks/${draggableId}/status`, { status: destCol });
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Error moving task. Reverting...', 'high');
      // Rollback to original position if backend fails
      setTasks(prev => {
        const next = {};
        Object.keys(prev).forEach(colName => {
          next[colName] = (prev[colName] || []).filter(x => x._id !== draggableId);
        });

        const sourceList = [...(next[sourceCol] || [])];
        sourceList.splice(source.index, 0, taskToMove);
        next[sourceCol] = sourceList;
        return next;
      });
    }
  };

  // Edit — called by modal on successful save
  const handleTaskSaved = (updatedTask) => {
    setTasks(prev => {
      const next = {};
      Object.keys(prev).forEach(colName => {
        next[colName] = (prev[colName] || []).filter(t => t._id !== updatedTask._id);
      });
      
      const columnsList = getColumnsList();
      const status = columnsList.includes(updatedTask.status) ? updatedTask.status : columnsList[0];
      if (!next[status]) next[status] = [];
      next[status].push(updatedTask);
      return next;
    });
    showPriorityAlert('Task updated!', 'low');
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tasks/${deleteTarget._id}`);
      // onDeleted socket event will handle state removal
      showPriorityAlert('Task deleted', 'low');
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Failed to delete task', 'high');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Update specific fields of a task (e.g. isStarred, labels) with Optimistic UI updates
  const handleUpdateTaskFields = async (taskId, fields) => {
    // Find the task inside current lists to get its status
    let currentTask = null;
    let currentStatus = '';
    for (const [status, list] of Object.entries(tasks)) {
      const found = list.find(t => t._id === taskId);
      if (found) { currentTask = found; currentStatus = status; break; }
    }
    if (!currentTask) return;

    // Optimistically update locally
    setTasks(prev => {
      const next = { ...prev };
      next[currentStatus] = next[currentStatus].map(t =>
        t._id === taskId ? { ...t, ...fields } : t
      );
      return next;
    });

    try {
      await api.put(`/tasks/${taskId}`, fields);
    } catch (err) {
      showPriorityAlert('Failed to update task. Reverting...', 'high');
      // Rollback on failure by re-fetching
      fetchTasks();
    }
  };

  // Open comments panel and reset unread badge counts
  const handleOpenComments = (task) => {
    setCommentTask(task);
    setUnreadCounts(prev => {
      const updated = { ...prev, [task._id]: 0 };
      localStorage.setItem(`unread_comments_${projectId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Health calc
  const colsList = getColumnsList();
  const finalCol = colsList[colsList.length - 1];
  const totalTasks = Object.values(tasks).flat().length;
  const completedCount = (tasks[finalCol] || []).length;
  const health = totalTasks === 0 ? 100 : Math.round((completedCount / totalTasks) * 100);
  const overdueCount = Object.values(tasks).flat().filter(
    t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== finalCol
  ).length;
  const healthStatus =
    overdueCount > 2 || health < 30
      ? { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' }
      : health < 60
      ? { label: 'At Risk', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: 'Healthy', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  const projectMembers = project?.members || [];

  // Workspace Template Conditional Check Flags
  const isSprint = project?.workflowType === 'Sprint';
  const isTodo = project?.workflowType === 'Todo';

  // Task lists and filters for Simple To-Do template
  const todoPendingTasks = Object.values(tasks).flat().filter(t => t.status !== finalCol);
  const todoCompletedTasks = Object.values(tasks).flat().filter(t => t.status === finalCol);

  // Toggle status optimistically for the To-Do checklist template
  const toggleTodoStatus = async (task) => {
    const nextStatus = task.status === finalCol ? colsList[0] : finalCol;
    setTasks(prev => {
      const next = {};
      Object.keys(prev).forEach(colName => {
        next[colName] = (prev[colName] || []).filter(x => x._id !== task._id);
      });
      const targetCol = next[nextStatus] || [];
      next[nextStatus] = [...targetCol, { ...task, status: nextStatus }];
      return next;
    });
    try {
      await api.put(`/tasks/${task._id}/status`, { status: nextStatus });
    } catch {
      showPriorityAlert('Failed to update task status. Reverting...', 'high');
      fetchTasks();
    }
  };

  // Scrum sprint estimation points aggregation
  const totalPoints = Object.values(tasks).flat().reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const completedPoints = (tasks[finalCol] || []).reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const sprintProgress = totalPoints === 0 ? 0 : Math.round((completedPoints / totalPoints) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-8">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-emerald-100/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-teal-100/15 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Dashboard
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-semibold text-gray-700">{project?.name || 'Project Board'}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{project?.name || 'Project Board'}</h1>
              {project?.workflowType && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {project.workflowType}
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${healthStatus.color}`}>
                {healthStatus.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <PresenceBar projectId={projectId} />
            <motion.button
              onClick={() => setAddOpen(v => !v)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25"
            >
              {addOpen ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
              {addOpen ? 'Cancel' : 'Add Task'}
            </motion.button>
          </div>
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {addOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <form
                onSubmit={handleCreateTask}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5 flex flex-wrap gap-3 items-end"
              >
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Design homepage layout"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-semibold"
                  >
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-medium"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md"
                >
                  Create Task
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board + Sidebar */}
        <div className="flex flex-col xl:flex-row gap-5">
          {/* Main Layout Pane */}
          <div className="flex-1 min-w-0">
            {/* Sprint Telemetry Banner */}
            {isSprint && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl shadow-indigo-500/15 border border-white/10 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">
                      🏃‍♂️ Active Sprint Progress
                    </span>
                    <h3 className="text-2xl font-black tracking-tight">Scrum Velocity Telemetry</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">{completedPoints}</span>
                    <span className="text-indigo-200 text-sm font-bold"> / {totalPoints} Story Points Completed</span>
                  </div>
                </div>
                {/* Progress bar inside the Sprint banner */}
                <div className="mt-5 relative z-10">
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-indigo-100">
                    <span>Target Goal Completion</span>
                    <span>{sprintProgress}%</span>
                  </div>
                  <div className="h-3 bg-indigo-950/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sprintProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}

            {isTodo ? (
              /* Simple To-Do checklist template */
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">To-Do Task Checklist</h3>
                  <p className="text-xs text-gray-400">Click checkboxes to move tasks between Open and Done lists instantly.</p>
                </div>

                {/* Open Tasks List */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Items ({todoPendingTasks.length})</h4>
                  </div>
                  <div className="space-y-2.5">
                    {todoPendingTasks.map(t => (
                      <div key={t._id} className="group flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100/80 bg-white hover:border-emerald-200/50 shadow-sm hover:shadow-md transition-all">
                        <button
                          onClick={() => toggleTodoStatus(t)}
                          className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-400 bg-white flex items-center justify-center transition-all flex-shrink-0"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {t.isStarred && (
                              <StarIconSolid className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.2)] animate-pulse" />
                            )}
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{t.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {t.labels?.map((l) => (
                              <span key={l._id} className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/40 uppercase tracking-wider">
                                {l.text}
                              </span>
                            ))}
                            {t.storyPoints > 0 && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/40">
                                {t.storyPoints} SP
                              </span>
                            )}
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${getPriority(t.priority).badge}`}>
                              {getPriority(t.priority).label}
                            </span>
                            {t.dueDate && (
                              <span className="text-[8px] text-gray-400 font-semibold">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenComments(t)} className="relative p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                            {(unreadCounts[t._id] || 0) > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white animate-bounce">
                                {unreadCounts[t._id]}
                              </span>
                            )}
                          </button>
                          <button onClick={() => setEditTask(t)} className="p-2 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {todoPendingTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-300">
                        <span className="text-2xl mb-1">🎉</span>
                        <p className="text-xs font-bold">All tasks completed! Enjoy the breather.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Tasks List */}
                <div className="border-t border-gray-50 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed Items ({todoCompletedTasks.length})</h4>
                  </div>
                  <div className="space-y-2.5 opacity-60">
                    {todoCompletedTasks.map(t => (
                      <div key={t._id} className="group flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100/50 bg-emerald-50/10">
                        <button
                          onClick={() => toggleTodoStatus(t)}
                          className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center transition-all flex-shrink-0"
                        >
                          <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-400 line-through leading-tight">{t.title}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {t.storyPoints > 0 && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-50/50 text-indigo-500 border border-indigo-100/20">
                                {t.storyPoints} SP
                              </span>
                            )}
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/30">
                              Completed
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenComments(t)} className="relative p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                            {(unreadCounts[t._id] || 0) > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white animate-bounce">
                                {unreadCounts[t._id]}
                              </span>
                            )}
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {todoCompletedTasks.length === 0 && (
                      <p className="text-center text-xs text-gray-300 font-semibold py-4">No completed tasks yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Drag and drop Kanban/Sprint multi-column board grid */
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 items-start select-none">
                  {getDynamicColumnConfig().map(col => (
                    <div key={col.id} className={`rounded-3xl ${col.accent} p-5 min-h-[480px] flex flex-col border border-gray-100/50 w-full lg:w-80 xl:flex-1 min-w-[290px] flex-shrink-0`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">{col.label}</h3>
                        {getWIPLimit(col.id) ? (
                          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full transition-all ${
                            (tasks[col.id]?.length || 0) > getWIPLimit(col.id)
                              ? 'bg-red-100 text-red-600 animate-pulse font-extrabold'
                              : 'bg-white/75 text-gray-400'
                          }`}>
                            {tasks[col.id]?.length || 0} / {getWIPLimit(col.id)} WIP
                          </span>
                        ) : (
                          <span className="ml-auto text-xs font-bold text-gray-400 bg-white/75 px-2 py-0.5 rounded-full">
                            {tasks[col.id]?.length || 0}
                          </span>
                        )}
                      </div>

                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-100/30' : ''}`}
                          >
                            {tasks[col.id]?.map((task, i) => (
                              <Draggable key={task._id} draggableId={task._id} index={i}>
                                {(prov) => (
                                  <KanbanCard
                                    task={task}
                                    provided={prov}
                                    onEdit={setEditTask}
                                    onDelete={setDeleteTarget}
                                    onComment={handleOpenComments}
                                    onUpdateTask={handleUpdateTaskFields}
                                    unreadCount={unreadCounts[task._id] || 0}
                                    projectWorkflowType={project?.workflowType}
                                  />
                                )}
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
            )}
          </div>

          {/* Sidebar: Activity */}
          <div className="xl:w-64 flex-shrink-0">
            <ActivityFeed projectId={projectId} initialEvents={activityEvents} />
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editTask}
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        onSave={handleTaskSaved}
        projectMembers={projectMembers}
        projectColumns={getColumnsList()}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        taskTitle={deleteTarget?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Comments Panel */}
      <TaskCommentsPanel
        task={commentTask}
        projectId={projectId}
        isOpen={!!commentTask}
        onClose={() => setCommentTask(null)}
      />
    </div>
  );
};

export default TaskBoard;
