const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const fs = require("fs");
const registerWhatsAppHandlers = require("../../handlers/whatsapp/whatsapp.handler");

// Ensure cache and auth directories exist
const cachePath = path.join(__dirname, "../../.wwebjs_cache");
const authPath = path.join(__dirname, "../../.wwebjs_auth");

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}
if (!fs.existsSync(authPath)) {
  fs.mkdirSync(authPath, { recursive: true });
}

// Global registry for clients and their state
const clients = new Map();

/**
 * Get or create a client state manager for a specific user
 */
const getOrCreateClientState = (userId) => {
  if (clients.has(userId)) {
    return clients.get(userId);
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: userId, // UNIQUE FOLDER PER USER
      dataPath: authPath,
    }),
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1039181464-alpha.html",
      path: cachePath,
    },
    puppeteer: {
      headless: true,
      handleSIGINT: false,
      handleSIGTERM: false,
      protocolTimeout: 300000,
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

  const state = {
    client,
    isInitialized: false,
    initializationPromise: null,
    messageQueue: [],
    qr: null,
  };

  const stateManager = {
    setInitialized: (val) => {
      state.isInitialized = val;
      if (!val) state.initializationPromise = null;
    },
    addMessage: (messageData) => {
      state.messageQueue.push(messageData);
      if (state.messageQueue.length > 100) state.messageQueue.shift();
    },
    getIsInitialized: () => state.isInitialized,
    getMessages: () => state.messageQueue,
    setAuthenticated: (isAuthenticated) => {
      const authFile = path.join(authPath, `session-${userId}.authenticated`);
      if (isAuthenticated) {
        fs.writeFileSync(authFile, "true");
      } else {
        if (fs.existsSync(authFile)) {
          try {
            fs.unlinkSync(authFile);
          } catch (e) {
            console.error(`Failed to delete session file for user ${userId}:`, e);
          }
        }
      }
    },
    setQr: (qrCode) => {
      state.qr = qrCode;
    },
    getQr: () => state.qr,
  };

  // Register all event handlers for this specific client
  registerWhatsAppHandlers(client, stateManager, userId);

  clients.set(userId, state);
  return state;
};

/**
 * Helper function to initialize the client with concurrency protection
 */
const initializeWhatsApp = async (userId) => {
  const state = getOrCreateClientState(userId);

  if (state.isInitialized) return true;
  if (state.initializationPromise) return state.initializationPromise;

  state.initializationPromise = (async () => {
    console.log(`Initializing WhatsApp client for user: ${userId}...`);
    try {
      await state.client.initialize();
      return true;
    } catch (error) {
      console.error(`WhatsApp initialization error for ${userId}:`, error);
      state.initializationPromise = null;
      throw error;
    }
  })();

  return state.initializationPromise;
};

/**
 * Graceful shutdown function for a specific user
 */
const closeWhatsApp = async (userId) => {
  if (clients.has(userId)) {
    const state = clients.get(userId);
    try {
      await state.client.destroy();
      state.isInitialized = false;
      state.initializationPromise = null;
      clients.delete(userId);
      console.log(`Closed WhatsApp client for user: ${userId}`);
    } catch (err) {
      console.error(`Error closing client for ${userId}:`, err);
    }
  }
};

/**
 * Close all active clients (useful for server shutdown)
 */
const closeAllClients = async () => {
  for (const userId of clients.keys()) {
    await closeWhatsApp(userId);
  }
};

/**
 * Helper function to check if a session already exists for a user
 */
const checkSessionExists = (userId) => {
  const sessionPath = path.join(authPath, `session-${userId}`);
  const authFile = path.join(authPath, `session-${userId}.authenticated`);
  try {
    return fs.existsSync(sessionPath) && fs.existsSync(authFile);
  } catch (e) {
    return false;
  }
};

/**
 * Return all existing session IDs from the file system
 */
const getAllExistingSessions = () => {
  try {
    if (!fs.existsSync(authPath)) return { authenticated: [], unauthenticated: [] };
    const files = fs.readdirSync(authPath);

    // Filter folders starting with 'session-' (excluding the .authenticated files themselves)
    const sessionFolders = files.filter(f =>
      f.startsWith('session-') &&
      !f.endsWith('.authenticated') &&
      fs.statSync(path.join(authPath, f)).isDirectory()
    );

    const authenticated = [];
    const unauthenticated = [];

    for (const folder of sessionFolders) {
      const userId = folder.replace('session-', '');
      const authFile = `session-${userId}.authenticated`;
      if (files.includes(authFile)) {
        authenticated.push(userId);
      } else {
        unauthenticated.push(userId);
      }
    }

    return { authenticated, unauthenticated };
  } catch (e) {
    return { authenticated: [], unauthenticated: [] };
  }
};

/**
 * Expose client access
 */
const getClient = (userId) => {
  if (!clients.has(userId)) return null;
  return clients.get(userId).client;
};

const getIsInitialized = (userId) => {
  if (!clients.has(userId)) return false;
  return clients.get(userId).isInitialized;
};

// Keep track of active socket connection counts and teardown timers per user
const activeConnections = new Map();
const teardownTimers = new Map();

/**
 * Increment the count of active socket connections for a user.
 * If a teardown timer was running for this user, clear it.
 * If the WhatsApp client is not yet running but a valid session exists, auto-initialize it.
 */
const incrementConnections = (userId) => {
  const currentCount = activeConnections.get(userId) || 0;
  const newCount = currentCount + 1;
  activeConnections.set(userId, newCount);
  
  console.log(`[User ${userId}] Active socket connections: ${newCount}`);

  // 1. Clear teardown timer if active
  if (teardownTimers.has(userId)) {
    console.log(`[User ${userId}] Reconnected within grace period. Cancelling graceful WhatsApp teardown.`);
    clearTimeout(teardownTimers.get(userId));
    teardownTimers.delete(userId);
  }

  // 2. Auto-initialize WhatsApp if they have a saved session but client is not initialized/initializing
  if (checkSessionExists(userId)) {
    const state = clients.get(userId);
    if (!state || (!state.isInitialized && !state.initializationPromise)) {
      console.log(`[User ${userId}] Active session detected on socket connect. Auto-initializing WhatsApp client...`);
      initializeWhatsApp(userId).catch((err) => {
        console.error(`[User ${userId}] Failed to auto-initialize WhatsApp on connect:`, err);
      });
    }
  }
};

/**
 * Decrement the count of active socket connections for a user.
 * If count reaches 0, start a 30-second graceful teardown timer to destroy the WhatsApp Chromium instance.
 */
const decrementConnections = (userId) => {
  const currentCount = activeConnections.get(userId) || 0;
  if (currentCount <= 0) return;

  const newCount = currentCount - 1;
  activeConnections.set(userId, newCount);
  
  console.log(`[User ${userId}] Active socket connections: ${newCount}`);

  if (newCount === 0) {
    console.log(`[User ${userId}] No active socket connections. Scheduling graceful WhatsApp teardown in 30 seconds...`);
    
    // Set 30 seconds grace period before closing the WhatsApp client
    const timer = setTimeout(async () => {
      try {
        console.log(`[User ${userId}] Grace period expired. Shutting down WhatsApp Chromium client to free RAM...`);
        await closeWhatsApp(userId);
        teardownTimers.delete(userId);
        activeConnections.delete(userId);
      } catch (err) {
        console.error(`[User ${userId}] Error tearing down WhatsApp client:`, err);
      }
    }, 30000);

    teardownTimers.set(userId, timer);
  }
};

module.exports = {
  initializeWhatsApp,
  closeWhatsApp,
  closeAllClients,
  checkSessionExists,
  getAllExistingSessions,
  getClient,
  getIsInitialized,
  getOrCreateClientState,
  incrementConnections,
  decrementConnections
};
