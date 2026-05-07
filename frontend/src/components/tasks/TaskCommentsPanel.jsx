import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const relativeTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 10)    return 'Just now';
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
};

const Avatar = ({ name, avatarUrl, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} rounded-full flex-shrink-0 overflow-hidden`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white font-bold`}>
          {name?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

/**
 * TaskCommentsPanel — slide-in panel showing comments for a task.
 * Props:
 *   task: { _id, title }
 *   projectId: string
 *   isOpen: boolean
 *   onClose: () => void
 */
const TaskCommentsPanel = ({ task, projectId, isOpen, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  // Emit live status (Typing / Viewing) to other team members in real-time
  useEffect(() => {
    if (!socket || !projectId || !isOpen) return;
    const statusValue = isTyping ? 'Typing' : 'Viewing';
    socket.emit('update_status', { projectId, status: statusValue });

    return () => {
      // Revert status to Viewing on close/unmount
      socket.emit('update_status', { projectId, status: 'Viewing' });
    };
  }, [isTyping, socket, projectId, isOpen]);

  // Fetch comments when panel opens
  useEffect(() => {
    if (!isOpen || !task?._id) return;
    setLoading(true);
    api.get(`/comments/tasks/${task._id}/comments`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [isOpen, task?._id]);

  // Real-time: new comments from socket
  useEffect(() => {
    if (!socket || !projectId) return;
    const onAdded = ({ taskId, comment }) => {
      if (taskId === task?._id) {
        // Skip appending comments sent by ourselves to prevent duplicate rendering (since they are handled optimistically)
        if (comment.author?._id === user?._id || comment.author === user?._id) return;

        setComments(prev => {
          const exists = prev.some(c => c._id === comment._id);
          return exists ? prev : [...prev, comment];
        });
      }
    };
    const onDeleted = ({ taskId, commentId }) => {
      if (taskId === task?._id) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    };
    socket.on('comment_added', onAdded);
    socket.on('comment_deleted', onDeleted);
    return () => {
      socket.off('comment_added', onAdded);
      socket.off('comment_deleted', onDeleted);
    };
  }, [socket, projectId, task?._id, user?._id]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (isOpen) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [comments, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    const tempId = `temp-${Date.now()}`;
    const commentContent = content.trim();

    // Create optimistic temporary comment structure
    const optimisticComment = {
      _id: tempId,
      content: commentContent,
      author: {
        _id: user?._id,
        name: user?.name,
        avatarUrl: user?.avatarUrl
      },
      createdAt: new Date().toISOString(),
    };

    // Synchronously append to view instantly with zero lag
    setComments(prev => [...prev, optimisticComment]);
    setContent('');

    try {
      const { data } = await api.post(`/comments/tasks/${task._id}/comments`, { content: commentContent });
      // Replace the temporary comment with the real saved database comment
      setComments(prev => prev.map(c => c._id === tempId ? data : c));
    } catch (err) {
      console.error('Comment error:', err);
      // Remove from comments list if it fails
      setComments(prev => prev.filter(c => c._id !== tempId));
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/tasks/${task._id}/comments/${commentId}`);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* Top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ChatBubbleLeftIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</p>
                <p className="text-sm font-bold text-gray-800 truncate">{task?.title}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-400 rounded-full animate-spin" />
                </div>
              )}

              {!loading && comments.length === 0 && (
                <div className="text-center py-10">
                  <ChatBubbleLeftIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No comments yet</p>
                  <p className="text-xs text-gray-300">Be the first to comment</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {comments.map((comment) => {
                  const isOwn = comment.author?._id === user?._id || comment.author === user?._id;
                  return (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar
                        name={comment.author?.name}
                        avatarUrl={comment.author?.avatarUrl}
                      />
                      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!isOwn && (
                          <span className="text-[10px] font-bold text-gray-500 px-1">{comment.author?.name}</span>
                        )}
                        <div className={`relative group px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          {comment.content}
                          {isOwn && (
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow"
                            >
                              <TrashIcon className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <span className={`text-[10px] text-gray-400 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {relativeTime(comment.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 px-4 py-4 border-t border-gray-100 bg-white flex-shrink-0"
            >
              <Avatar name={user?.name} avatarUrl={user?.avatarUrl} />
              <div className="flex-1 flex items-end gap-2">
                <textarea
                  value={content}
                  onChange={e => {
                    setContent(e.target.value);
                    setIsTyping(e.target.value.trim().length > 0);
                  }}
                  onFocus={e => setIsTyping(e.target.value.trim().length > 0)}
                  onBlur={() => setIsTyping(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setIsTyping(false);
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Write a comment… (Enter to send)"
                  rows={1}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium resize-none transition-all"
                  style={{ maxHeight: '100px', overflowY: 'auto' }}
                />
                <motion.button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <PaperAirplaneIcon className="w-4 h-4" />
                  }
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskCommentsPanel;
