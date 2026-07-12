const {
  getIsInitialized,
  initializeWhatsApp,
  checkSessionExists,
} = require("../../services/whatsapp/whatsapp.service");

/**
 * Wait up to `timeoutMs` for the WhatsApp client to become fully initialized.
 * Returns true if ready in time, false if timed out.
 */
function waitForInitialized(userId, timeoutMs = 30000) {
  return new Promise((resolve) => {
    if (getIsInitialized(userId)) return resolve(true);
    const interval = setInterval(() => {
      if (getIsInitialized(userId)) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve(true);
      }
    }, 500);
    const timer = setTimeout(() => {
      clearInterval(interval);
      resolve(false);
    }, timeoutMs);
  });
}

async function whatsAppMiddleware(req, res, next) {
  try {
    const userId = req.user?.id || req.body?.userId || req.headers["x-user-id"] || req.query?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. userId is required to access WhatsApp services." 
      });
    }

    // Check if session exists in file system first.
    // If no session exists, return 503 immediately without spawning a Chrome browser process.
    if (!checkSessionExists(userId)) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp service is not connected for this user. Please authenticate first.",
        details: "No active session found. Please request a QR code to login.",
      });
    }

    // Kick off initialization (no-op if already running or done)
    initializeWhatsApp(userId).catch(() => {});

    // Wait up to 30s for the client to be fully ready (handles first-request-after-restart)
    const ready = await waitForInitialized(userId, 30000);
    if (!ready) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp service is starting up. Please try again in a moment.",
        details: "Client initialization timed out after 30 seconds.",
      });
    }

    // Attach userId to req for convenience in downstream controllers
    req.currentUserId = userId;
    
    // Success: Proceed to the next middleware/controller
    next();
  } catch (error) {
    console.error(`WhatsApp Middleware Error for user ${req.user?.id || req.body?.userId || req.headers["x-user-id"]}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify WhatsApp connection status.",
      error: error.message,
    });
  }
}

module.exports = whatsAppMiddleware;
