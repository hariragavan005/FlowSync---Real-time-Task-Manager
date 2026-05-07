import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const PRIORITY_COLORS = {
  Highest: 'bg-red-500',
  High:    'bg-orange-400',
  Medium:  'bg-yellow-400',
  Low:     'bg-blue-400',
  Lowest:  'bg-gray-300',
};

/**
 * ProjectStatsModal — shows per-project analytics in a slide-over panel.
 * Props:
 *   projectId: string
 *   projectName: string
 *   isOpen: boolean
 *   onClose: () => void
 */
const ProjectStatsModal = ({ projectId, projectName, isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}/stats`)
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [isOpen, projectId]);

  const circumference = 2 * Math.PI * 30;
  const completionDash = stats
    ? circumference - (stats.completionRate / 100) * circumference
    : circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Project Analytics</h2>
                  <p className="text-xs text-gray-400">{projectName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-7 space-y-5">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}

              {!loading && !stats && (
                <p className="text-sm text-gray-400 text-center py-8">Failed to load stats.</p>
              )}

              {!loading && stats && (
                <>
                  {/* Completion Ring + Summary */}
                  <div className="flex items-center gap-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#d1fae5" strokeWidth="8" />
                        <circle cx="40" cy="40" r="30" fill="none"
                          stroke="url(#statsGrad)" strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={circumference} strokeDashoffset={completionDash}
                          transform="rotate(-90 40 40)"
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                        <defs>
                          <linearGradient id="statsGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-extrabold text-emerald-700">{stats.completionRate}%</span>
                      </div>
                    </div>

                    {/* Numbers */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total', value: stats.total,      color: 'text-gray-700' },
                        { label: 'Done',  value: stats.completed,  color: 'text-emerald-600' },
                        { label: 'Active',value: stats.inProgress, color: 'text-blue-600' },
                        { label: 'Overdue',value: stats.overdue,   color: 'text-red-500' },
                      ].map(s => (
                        <div key={s.label} className="bg-white/70 rounded-xl p-2.5 text-center">
                          <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] font-semibold text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Priority Breakdown</h4>
                    <div className="space-y-2">
                      {stats.priorities.map(({ priority, count }) => (
                        <div key={priority} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-600 w-14">{priority}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: stats.total > 0 ? `${Math.round((count / stats.total) * 100)}%` : '0%' }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${PRIORITY_COLORS[priority]}`}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Member Stats */}
                  {stats.memberStats?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Team Workload — {stats.teamSize} members
                      </h4>
                      <div className="space-y-2.5">
                        {stats.memberStats.map(m => (
                          <div key={m._id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                                  {m.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-700 truncate">{m.name}</p>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-[10px] text-emerald-600 font-semibold">{m.completed} done</span>
                                <span className="text-[10px] text-blue-500 font-semibold">{m.inProgress} active</span>
                                <span className="text-[10px] text-gray-400 font-semibold">{m.pending} pending</span>
                              </div>
                            </div>
                            <span className="text-sm font-extrabold text-gray-600">{m.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectStatsModal;
