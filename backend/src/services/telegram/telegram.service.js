const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const path = require("path");
const fs = require("fs");
const socketService = require("../socket.service");

// Ensure sessions directory exists
const sessionsPath = path.join(__dirname, "../../../.telegram_sessions");

if (!fs.existsSync(sessionsPath)) {
  fs.mkdirSync(sessionsPath, { recursive: true });
}

// Global registry for Telegram clients and their active states
const clients = new Map();

const getApiCredentials = () => {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  return {
    apiId: apiId ? Number(apiId) : null,
    apiHash: apiHash || null,
  };
};

/**
 * Get or create the Telegram client state manager for a specific user
 */
const getOrCreateClientState = (userId) => {
  if (clients.has(userId)) {
    return clients.get(userId);
  }

  const { apiId, apiHash } = getApiCredentials();
  const sessionFile = path.join(sessionsPath, `session-${userId}.session`);
  let savedSessionString = "";

  if (fs.existsSync(sessionFile)) {
    try {
      savedSessionString = fs.readFileSync(sessionFile, "utf-8").trim();
      console.log(`[Telegram - User ${userId}] Loaded existing saved session string.`);
    } catch (err) {
      console.error(`[Telegram - User ${userId}] Error reading session file:`, err);
    }
  }

  const session = new StringSession(savedSessionString);
  // Use dummy credentials during constructor initialization if not configured in .env yet
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: true,
  });

  const state = {
    client,
    isInitialized: false,
    initializationPromise: null,
    qr: null,
    passwordPromise: null, // Deferred promise for 2FA password submission
    phoneCodeHash: null,
    phoneNumber: null,
  };

  const stateManager = {
    state,
    setInitialized: (val) => {
      state.isInitialized = val;
      if (!val) {
        state.initializationPromise = null;
      }
    },
    getIsInitialized: () => state.isInitialized,
    saveSession: () => {
      try {
        const sessionString = client.session.save();
        fs.writeFileSync(sessionFile, sessionString, "utf-8");
        console.log(`[Telegram - User ${userId}] Session saved successfully.`);
      } catch (err) {
        console.error(`[Telegram - User ${userId}] Failed to save session string:`, err);
      }
    },
    deleteSession: () => {
      state.isInitialized = false;
      state.qr = null;
      state.phoneCodeHash = null;
      state.phoneNumber = null;
      if (fs.existsSync(sessionFile)) {
        try {
          fs.unlinkSync(sessionFile);
          console.log(`[Telegram - User ${userId}] Session file deleted.`);
        } catch (err) {
          console.error(`[Telegram - User ${userId}] Error deleting session file:`, err);
        }
      }
    },
    setQr: (qrCode) => {
      state.qr = qrCode;
    },
    getQr: () => state.qr,
    clearQr: () => {
      state.qr = null;
    },
  };

  clients.set(userId, stateManager);
  return stateManager;
};

/**
 * Initialize and connect the Telegram client for a user
 */
const initializeTelegram = async (userId) => {
  const { apiId, apiHash } = getApiCredentials();
  if (!apiId || !apiHash) {
    throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in environment variables.");
  }

  const stateManager = getOrCreateClientState(userId);
  const { state } = stateManager;

  if (state.isInitialized) return true;
  if (state.initializationPromise) return state.initializationPromise;

  state.initializationPromise = (async () => {
    console.log(`Initializing Telegram client for user: ${userId}...`);
    try {
      // Re-apply correct credentials from environment variables in case they were updated
      state.client.apiId = apiId;
      state.client.apiHash = apiHash;

      await state.client.connect();

      // Check if already authenticated using the loaded StringSession
      const isAuthorized = await state.client.isUserAuthorized();
      if (isAuthorized) {
        console.log(`🚀 [Telegram - User ${userId}] Client is fully authorized and ready!`);
        stateManager.setInitialized(true);
      } else {
        console.log(`[*] [Telegram - User ${userId}] Client connected but requires authentication.`);
      }
      return true;
    } catch (error) {
      console.error(`Telegram connection/initialization error for user ${userId}:`, error);
      state.initializationPromise = null;
      throw error;
    }
  })();

  return state.initializationPromise;
};

/**
 * Cleanly close a user's Telegram client session
 */
const closeTelegram = async (userId) => {
  if (clients.has(userId)) {
    const stateManager = clients.get(userId);
    try {
      await stateManager.state.client.disconnect();
      stateManager.setInitialized(false);
      clients.delete(userId);
      console.log(`Closed Telegram client for user: ${userId}`);
    } catch (err) {
      console.error(`Error closing Telegram client for user ${userId}:`, err);
    }
  }
};

/**
 * Close all active Telegram clients
 */
const closeAllTelegramClients = async () => {
  for (const userId of clients.keys()) {
    await closeTelegram(userId);
  }
};

/**
 * Check if a session already exists for a user in the file system
 */
const checkSessionExists = (userId) => {
  const sessionFile = path.join(sessionsPath, `session-${userId}.session`);
  try {
    if (!fs.existsSync(sessionFile)) return false;
    const stats = fs.statSync(sessionFile);
    return stats.isFile() && stats.size > 0;
  } catch (e) {
    return false;
  }
};

/**
 * Return all existing session IDs from the file system
 */
const getAllExistingSessions = () => {
  try {
    if (!fs.existsSync(sessionsPath)) return { authenticated: [], unauthenticated: [] };
    const files = fs.readdirSync(sessionsPath);

    // Filter files starting with 'session-' and ending with '.session'
    const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.session'));

    const authenticated = [];
    const unauthenticated = [];

    for (const file of sessionFiles) {
      const userId = file.replace('session-', '').replace('.session', '');
      // Check if session can authorize successfully
      authenticated.push(userId);
    }

    return { authenticated, unauthenticated };
  } catch (e) {
    return { authenticated: [], unauthenticated: [] };
  }
};

/**
 * Access a specific user's GramJS client
 */
const getClient = (userId) => {
  if (!clients.has(userId)) return null;
  return clients.get(userId).state.client;
};

module.exports = {
  getOrCreateClientState,
  initializeTelegram,
  closeTelegram,
  closeAllTelegramClients,
  checkSessionExists,
  getAllExistingSessions,
  getClient,
};
