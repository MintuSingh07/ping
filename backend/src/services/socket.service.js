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
      console.log("A user connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    return this.io;
  }

  emit(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    } else {
      console.warn("Socket.io not initialized. Cannot emit event:", event);
    }
  }
}

module.exports = new SocketService();
