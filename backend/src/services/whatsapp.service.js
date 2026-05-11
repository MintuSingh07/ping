const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const fs = require("fs");

// Ensure cache directory exists
const cachePath = path.join(__dirname, "../../.wwebjs_cache");
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}

// Initialize client with optimized Puppeteer settings and explicit clientId for persistence
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "ping-auth",
    dataPath: path.join(__dirname, "../../.wwebjs_auth"),
  }),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1039181464-alpha.html",
    path: cachePath,
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

const registerWhatsAppHandlers = require("../handlers/whatsapp.handler");

let isInitialized = false;
let initializationPromise = null;
let messageQueue = [];

// Initialize state manager to pass to handlers
const stateManager = {
  setInitialized: (val) => {
    isInitialized = val;
    if (!val) initializationPromise = null;
  },
  addMessage: (messageData) => {
    messageQueue.push(messageData);
    if (messageQueue.length > 100) messageQueue.shift();
  },
};

// Register all event handlers
registerWhatsAppHandlers(client, stateManager);

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
