const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");

// Initialize client with optimized Puppeteer settings and explicit clientId for persistence
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "ping-auth",
    dataPath: path.join(__dirname, "../../.wwebjs_auth"),
  }),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1039171941-alpha.html",
  },
  puppeteer: {
    headless: false,
    handleSIGINT: false,
    handleSIGTERM: false,
    executablePath:
      process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

const socketService = require("./socket.service");

let isInitialized = false;
let initializationPromise = null;
let messageQueue = [];

// Global event listeners


client.on("message", async (msg) => {
  try {
    if (msg.body == "") return;
    const contact = await msg.getContact();
    console.log(`New message from ${contact.name || msg.from}: ${msg.body}`);
    console.log("Push Name : ", contact.pushname);

    const messageData = {
      whatsapp_id: msg.from,
      savedName: contact.name,
      pushName: contact.pushname,
      body: msg.body,
      timestamp: new Date(),
    };

    messageQueue.push(messageData);
    if (messageQueue.length > 100) messageQueue.shift();

    socketService.emit("new_message", messageData);
  } catch (err) {
    console.error("Error in message listener:", err);
  }
});

client.on("authenticated", () => {
  console.log("✅ WhatsApp Authentication successful! Syncing data...");
});

client.on("auth_failure", (msg) => {
  console.error("❌ WhatsApp Authentication failed:", msg);
  isInitialized = false;
  initializationPromise = null;
});

client.on("loading_screen", (percent, message) => {
  console.log(`⏳ WhatsApp Loading: ${percent}% - ${message}`);
});

client.on("ready", () => {
  console.log("🚀 WhatsApp Client is ready!");
  isInitialized = true;
});

client.on("disconnected", (msg) => {
  console.log("🔌 WhatsApp Client disconnected:", msg);
  isInitialized = false;
  initializationPromise = null;
});

// Helper function to initialize the client with concurrency protection
const initializeWhatsApp = async () => {
  if (isInitialized) return true;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    console.log("Initializing WhatsApp client...");
    try {
      await client.initialize();
      return true;
    } catch (error) {
      console.error("WhatsApp initialization error:", error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

// Graceful shutdown function
const closeWhatsApp = async () => {
  try {
    await client.destroy();
    isInitialized = false;
    initializationPromise = null;
  } catch (err) {}
};

// Exporting the client, initialization function, and state
// Helper function to check if a session already exists
const checkSessionExists = () => {
  const sessionPath = path.join(
    __dirname,
    "../../.wwebjs_auth/session-ping-auth",
  );
  // A valid session usually has a "Default" or "lock" file inside it
  try {
    const fs = require("fs");
    return fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0;
  } catch (e) {
    return false;
  }
};

module.exports = {
  client,
  initializeWhatsApp,
  closeWhatsApp,
  checkSessionExists,
  getIsInitialized: () => isInitialized,
  getMessages: () => messageQueue,
};
