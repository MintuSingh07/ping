const {
  getIsInitialized,
  initializeWhatsApp,
} = require("../../services/whatsapp/whatsapp.service");

async function whatsAppMiddleware(req, res, next) {
  try {
    const userId = req.user?.id || req.body?.userId || req.headers["x-user-id"] || req.query?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. userId is required to access WhatsApp services." 
      });
    }

    // Attempt to initialize the client if it's not already initialized
    await initializeWhatsApp(userId);

    // Check if the client is actually connected and ready to send/receive messages
    if (!getIsInitialized(userId)) {
      return res.status(503).json({
        success: false,
        message:
          "WhatsApp service is not connected for this user. Please authenticate first.",
        details:
          "You might need to scan the QR code or wait for the connection to be established.",
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
