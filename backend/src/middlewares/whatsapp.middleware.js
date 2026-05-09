const {
  getIsInitialized,
  initializeWhatsApp,
} = require("../services/whatsapp.service");

async function whatsAppMiddleware(req, res, next) {
  try {
    // Attempt to initialize the client if it's not already initialized
    await initializeWhatsApp();

    // Check if the client is actually connected and ready to send/receive messages
    if (!getIsInitialized()) {
      return res.status(503).json({
        success: false,
        message:
          "WhatsApp service is not connected. Please authenticate first.",
        details:
          "You might need to scan the QR code or wait for the connection to be established.",
      });
    }

    // Success: Proceed to the next middleware/controller
    next();
  } catch (error) {
    console.error("WhatsApp Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify WhatsApp connection status.",
      error: error.message,
    });
  }
}

module.exports = whatsAppMiddleware;
