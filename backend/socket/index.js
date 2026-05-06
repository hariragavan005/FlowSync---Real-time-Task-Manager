// Backend socket/index.js — Presence + Activity tracking
const onlineUsers = new Map(); // socketId → { userId, userName, projectId, status }

module.exports = (io) => {
  io.on('connection', (socket) => {

    // User presence: announce online with identity
    socket.on('user_online', ({ userId, userName }) => {
      onlineUsers.set(socket.id, { userId, userName, status: 'Online', projectId: null });
    });

    // Join a project room for real-time updates
    socket.on('join_project', ({ projectId, userId, userName }) => {
      socket.join(projectId);
      const user = onlineUsers.get(socket.id) || { userId, userName };
      user.projectId = projectId;
      user.status = 'Viewing';
      onlineUsers.set(socket.id, user);

      // Broadcast updated presence to project room
      const roomUsers = [...onlineUsers.values()].filter(u => u.projectId === projectId);
      io.to(projectId).emit('presence_update', roomUsers);

      // Broadcast activity event
      io.to(projectId).emit('activity_event', {
        type: 'joined',
        userName,
        message: `${userName} joined the project`,
        timestamp: new Date().toISOString()
      });
    });

    // Status update (Typing, Editing, Idle, Viewing)
    socket.on('update_status', ({ projectId, status }) => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        user.status = status;
        onlineUsers.set(socket.id, user);
        const roomUsers = [...onlineUsers.values()].filter(u => u.projectId === projectId);
        io.to(projectId).emit('presence_update', roomUsers);
      }
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(projectId);
      const user = onlineUsers.get(socket.id);
      if (user) { user.projectId = null; user.status = 'Online'; }
    });

    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user?.projectId) {
        const roomUsers = [...onlineUsers.values()].filter(u => u.projectId === user.projectId && u.userId !== user.userId);
        io.to(user.projectId).emit('presence_update', roomUsers);
      }
      onlineUsers.delete(socket.id);
    });
  });
};
