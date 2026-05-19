const http = require("http");
const app = require("./src/app");
const {
  initializeWhatsApp,
  getAllExistingSessions,
  closeAllClients
} = require("./src/services/whatsapp.service");
const socketService = require("./src/services/socket.service");

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Initialize Socket.io
socketService.initialize(server);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Auto-initialize only authenticated existing sessions
  const { authenticated, unauthenticated } = getAllExistingSessions();

  if (unauthenticated.length > 0) {
    for (const userId of unauthenticated) {
      console.log(`[-] Credentials not found for user "${userId}". You are not logged in with WhatsApp.`);
    }
  }
  
  if (authenticated.length > 0) {
    console.log(`[+] Found ${authenticated.length} authenticated session(s). Initializing...`);
    for (const userId of authenticated) {
      try {
        await initializeWhatsApp(userId);
      } catch (error) {
        console.error(`Failed to auto-initialize WhatsApp for user ${userId}:`, error);
      }
    }
  } else {
    console.log("[*] No active sessions found to auto-login. Waiting for /qr API to initialize clients...");
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Cleaning up all clients...`);
  await closeAllClients();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));
