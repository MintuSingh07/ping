const { Server } = require("socket.io");

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Adjust this for production
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      // 1. Expect the client to pass their userId when connecting
      const userId = socket.handshake.query.userId;
      
      console.log(`Socket connected: ${socket.id}`);

      if (userId) {
        // 2. Join a private room for this specific user
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined room: user_${userId}`);
      } else {
        console.warn(`Socket ${socket.id} connected without a userId.`);
      }

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Use this for global announcements (rare)
  emit(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    } else {
      console.warn("Socket.io not initialized. Cannot emit event:", event);
    }
  }

  // Use this to send data ONLY to a specific user
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    } else {
      console.warn("Socket.io not initialized. Cannot emitToUser event:", event);
    }
  }
}

module.exports = new SocketService();
