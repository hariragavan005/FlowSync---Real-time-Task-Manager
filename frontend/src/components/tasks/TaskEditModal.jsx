import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const PRIORITIES = [
  { id: 'Highest', label: 'Highest', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'High',    label: 'High',    dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'Medium',  label: 'Medium',  dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 'Low',     label: 'Low',     dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'Lowest',  label: 'Lowest',  dot: 'bg-gray-300',   badge: 'bg-gray-50 text-gray-500 border-gray-200' },
];

const STATUSES = ['Pending', 'In Progress', 'Completed'];

/**
 * TaskEditModal — edit all fields of a task in a premium modal.
 * Props:
 *   task: the task object to edit
 *   isOpen: boolean
 *   onClose: () => void
 *   onSave: (updatedTask) => void  — called with the server response
 *   projectMembers: [{ _id, name, email }]  — for assignee dropdown
 *   projectColumns: [string] — custom stages list
 */
const TaskEditModal = ({ task, isOpen, onClose, onSave, projectMembers = [], projectColumns = [] }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
    assignee: '',
    storyPoints: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync form with task whenever task changes or modal opens
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || (projectColumns && projectColumns.length > 0 ? projectColumns[0] : 'To Do'),
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        assignee: task.assignee?._id || task.assignee || '',
        storyPoints: task.storyPoints || 0,
      });
      setError('');
    }
  }, [task, isOpen, projectColumns]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        assignee: form.assignee || null,
        storyPoints: Number(form.storyPoints) || 0,
      };
      const { data } = await api.put(`/tasks/${task._id}`, payload);
      onSave(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = PRIORITIES.find(p => p.id === form.priority) || PRIORITIES[2];

  return (
    <AnimatePresence>
      {isOpen && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.35 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition z-20"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Task</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update task details</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Task title"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Optional description…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all resize-none"
                />
              </div>

              {/* Priority + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={e => set('priority', e.target.value)}
                      className="w-full px-3 py-2.5 pr-8 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-semibold appearance-none cursor-pointer"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${selectedPriority.dot}`} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-semibold appearance-none cursor-pointer"
                  >
                    {(projectColumns && projectColumns.length > 0 ? projectColumns : ['To Do', 'In Progress', 'Done']).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date + Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => set('dueDate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assignee</label>
                  <select
                    value={form.assignee}
                    onChange={e => set('assignee', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 outline-none text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Story Points (Sprint Estimation)</label>
                <input
                  type="number"
                  min="0"
                  value={form.storyPoints}
                  onChange={e => set('storyPoints', e.target.value)}
                  placeholder="e.g. 1, 2, 3, 5, 8, 13"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskEditModal;
