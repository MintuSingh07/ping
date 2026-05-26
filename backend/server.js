const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/models/db");
const {
  initializeWhatsApp,
  getAllExistingSessions: getAllWhatsAppSessions,
  closeAllClients: closeAllWhatsAppClients
} = require("./src/services/whatsapp/whatsapp.service");
const {
  initializeTelegram,
  getAllExistingSessions: getAllTelegramSessions,
  closeAllTelegramClients
} = require("./src/services/telegram/telegram.service");
const socketService = require("./src/services/socket.service");

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Initialize Socket.io
socketService.initialize(server);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failed during startup:", err);
  }

  // Auto-initialize only authenticated existing WhatsApp sessions
  const { authenticated: authWA, unauthenticated: unauthWA } = getAllWhatsAppSessions();

  if (unauthWA.length > 0) {
    for (const userId of unauthWA) {
      console.log(`[-] Credentials not found for user "${userId}". You are not logged in with WhatsApp.`);
    }
  }
  
  if (authWA.length > 0) {
    console.log(`[+] Found ${authWA.length} authenticated WhatsApp session(s). Initializing...`);
    for (const userId of authWA) {
      try {
        await initializeWhatsApp(userId);
      } catch (error) {
        console.error(`Failed to auto-initialize WhatsApp for user ${userId}:`, error);
      }
    }
  } else {
    console.log("[*] No active WhatsApp sessions found to auto-login. Waiting for /qr API to initialize clients...");
  }

  // Auto-initialize only authenticated existing Telegram sessions
  try {
    const { authenticated: authTG } = getAllTelegramSessions();
    if (authTG.length > 0) {
      console.log(`[+] Found ${authTG.length} authenticated Telegram session(s). Initializing...`);
      for (const userId of authTG) {
        try {
          await initializeTelegram(userId);
        } catch (error) {
          console.error(`Failed to auto-initialize Telegram for user ${userId}:`, error);
        }
      }
    } else {
      console.log("[*] No active Telegram sessions found to auto-login.");
    }
  } catch (tgInitErr) {
    console.error("Failed to auto-initialize Telegram sessions:", tgInitErr);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Cleaning up all clients...`);
  await closeAllWhatsAppClients();
  await closeAllTelegramClients();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));
