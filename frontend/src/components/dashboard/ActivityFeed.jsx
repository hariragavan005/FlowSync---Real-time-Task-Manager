import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

// Relative time helper
const relativeTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const iconMap = {
  joined:         { dot: 'bg-blue-500',    label: 'Joined' },
  task_completed: { dot: 'bg-emerald-500', label: 'Completed' },
  task_created:   { dot: 'bg-teal-500',    label: 'Created' },
  project_created:{ dot: 'bg-indigo-500',  label: 'Project' },
  default:        { dot: 'bg-gray-400',    label: 'Update' },
};

const ActivityFeed = ({ projectId, initialEvents = [] }) => {
  const socket = useSocket();
  const [events, setEvents] = useState(initialEvents.slice(0, 20));

  useEffect(() => {
    if (!socket || !projectId) return;
    const handler = (event) => {
      setEvents(prev => [event, ...prev].slice(0, 20));
    };
    socket.on('activity_event', handler);
    return () => socket.off('activity_event', handler);
  }, [socket, projectId]);

  if (!events.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-sm font-extrabold text-gray-800">Recent Activity</h3>
      </div>
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.map((event, i) => {
            const style = iconMap[event.type] || iconMap.default;
            return (
              <motion.div
                key={`${event.timestamp}-${i}`}
                initial={{ opacity: 0, x: -12, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-1.5 flex items-center gap-1.5">
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
    </motion.div>
  );
};

export default ActivityFeed;
