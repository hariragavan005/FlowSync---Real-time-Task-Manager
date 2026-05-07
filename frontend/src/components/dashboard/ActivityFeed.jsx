import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const relativeTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 10)   return 'Just now';
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
};

const iconMap = {
  joined:          { dot: 'bg-blue-500',    label: 'Joined' },
  task_completed:  { dot: 'bg-emerald-500', label: 'Completed' },
  task_created:    { dot: 'bg-teal-500',    label: 'Created' },
  task_updated:    { dot: 'bg-sky-400',     label: 'Updated' },
  task_deleted:    { dot: 'bg-red-400',     label: 'Deleted' },
  project_created: { dot: 'bg-indigo-500',  label: 'Project' },
  project_locked:  { dot: 'bg-amber-500',   label: 'Locked' },
  project_unlocked:{ dot: 'bg-green-400',   label: 'Unlocked' },
  default:         { dot: 'bg-gray-400',    label: 'Update' },
};

// ── Component ─────────────────────────────────────────────────────────────────
const ActivityFeed = ({ projectId, initialEvents = [] }) => {
  const socket = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch persisted history on mount
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}/activity`)
      .then(({ data }) => {
        // Convert DB logs → same shape as socket events
        const normalized = data.map(log => ({
          type:      log.type,
          userName:  log.userName,
          message:   log.message,
          timestamp: log.createdAt,
        }));
        // Merge with initialEvents (real-time events already buffered in parent)
        const merged = [...initialEvents, ...normalized];
        // Deduplicate by timestamp+message, keep newest first
        const seen = new Set();
        const deduped = merged.filter(e => {
          const key = `${e.timestamp}-${e.message}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
        setEvents(deduped);
      })
      .catch(() => {
        // Fall back to initial events only
        setEvents(initialEvents.slice(0, 20));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Real-time events from socket
  useEffect(() => {
    if (!socket || !projectId) return;
    const handler = (event) => {
      setEvents(prev => {
        const next = [event, ...prev].slice(0, 50);
        return next;
      });
    };
    socket.on('activity_event', handler);
    return () => socket.off('activity_event', handler);
  }, [socket, projectId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-sm font-extrabold text-gray-800 flex-1">Recent Activity</h3>
        {loading && (
          <span className="w-3 h-3 border-2 border-gray-200 border-t-emerald-400 rounded-full animate-spin" />
        )}
      </div>

      {events.length === 0 && !loading ? (
        <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const style = iconMap[event.type] || iconMap.default;
              return (
                <motion.div
                  key={`${event.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 leading-snug">{event.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(event.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
