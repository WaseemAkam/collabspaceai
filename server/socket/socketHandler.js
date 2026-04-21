const Message = require('../models/Message');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a project room
    socket.on('joinRoom', (projectId) => {
      socket.join(projectId);
    });

    // Send message
    socket.on('sendMessage', async ({ content, senderId, senderName, projectId }) => {
      const message = await Message.create({
        content,
        sender: senderId,
        project: projectId
      });

      io.to(projectId).emit('receiveMessage', {
        _id: message._id,
        content,
        sender: { _id: senderId, name: senderName },
        createdAt: message.createdAt,
        reactions: []
      });
    });

    // React to message
    socket.on('reactMessage', async ({ messageId, emoji, userId, projectId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        let react = msg.reactions.find(r => r.emoji === emoji);
        if (react) {
          const idx = react.users.findIndex(u => u.toString() === userId.toString());
          if (idx > -1) react.users.splice(idx, 1);
          else react.users.push(userId);
          if (react.users.length === 0) {
            msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          msg.reactions.push({ emoji, users: [userId] });
        }
        await msg.save();
        io.to(projectId).emit('messageReacted', { messageId, reactions: msg.reactions });
      } catch (e) { console.error(e); }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;