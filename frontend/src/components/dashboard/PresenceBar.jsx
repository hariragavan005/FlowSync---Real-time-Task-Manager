import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

// Status style map
const statusStyles = {
  Online: 'bg-emerald-400',
  Viewing: 'bg-emerald-500',
  Typing: 'bg-amber-400',
  Editing: 'bg-blue-400',
  Idle: 'bg-gray-300',
};

const statusLabels = {
  Online: 'Online',
  Viewing: 'Viewing project',
  Typing: 'Typing...',
  Editing: 'Editing tasks',
  Idle: 'Idle',
};

const PresenceBar = ({ projectId, members = [] }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!socket || !projectId) return;
    // Announce join
    socket.emit('join_project', { projectId, userId: user?._id, userName: user?.name });

    const handlePresence = (users) => setOnlineUsers(users);
    socket.on('presence_update', handlePresence);

    return () => {
      socket.off('presence_update', handlePresence);
      socket.emit('leave_project', projectId);
    };
  }, [socket, projectId, user]);

  if (!onlineUsers.length) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-gray-500">{onlineUsers.length} online</span>
      </div>
      <div className="flex -space-x-1.5">
        <AnimatePresence>
          {onlineUsers.slice(0, 6).map((u, i) => (
            <motion.div
              key={u.userId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.4, delay: i * 0.04 }}
              className="relative cursor-pointer"
              onMouseEnter={() => setTooltip(u)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className={`w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                {(u.userName || '?').charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusStyles[u.status] || 'bg-gray-300'}`} />

              {/* Tooltip */}
              <AnimatePresence>
                {tooltip?.userId === u.userId && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
                  >
                    <div className="bg-gray-900/90 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-sm shadow-xl">
                      <p className="font-bold">{u.userName}</p>
                      <p className="text-gray-400">{statusLabels[u.status] || u.status}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Activity hint */}
      {onlineUsers.find(u => u.status === 'Typing') && (
        <span className="text-[10px] text-amber-500 font-semibold animate-pulse">
          {onlineUsers.find(u => u.status === 'Typing')?.userName} is typing...
        </span>
      )}
    </div>
  );
};

export default PresenceBar;
