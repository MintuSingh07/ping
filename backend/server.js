const http = require("http");
const app = require("./src/app");
const { initializeWhatsApp, checkSessionExists } = require("./src/services/whatsapp.service");
const socketService = require("./src/services/socket.service");

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Initialize Socket.io
socketService.initialize(server);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Only initialize on startup if credentials exist
  if (checkSessionExists()) {
    console.log("Credentials found. Logging in directly...");
    try {
      await initializeWhatsApp();
    } catch (error) {
      console.error("Failed to auto-initialize WhatsApp:", error);
    }
  } else {
    console.log("No credentials found. Waiting for /qr API to initialize...");
  }
});


// Graceful shutdown
const { closeWhatsApp } = require("./src/services/whatsapp.service");
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Cleaning up...`);
  await closeWhatsApp();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));

