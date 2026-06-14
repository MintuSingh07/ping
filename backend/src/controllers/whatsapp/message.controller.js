const { getClient, getIsInitialized, closeWhatsApp } = require("../../services/whatsapp/whatsapp.service");
const { sendMedia } = require("../../services/whatsapp/media.service");

async function sendMessageController(req, res) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const client = getClient(userId);
    if (!client) {
      return res.status(404).json({ success: false, message: "WhatsApp client not found for this user. Please login first." });
    }

    const { chatId, message, quotedMessageId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Sender ID is required",
      });
    }

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    // Ensure the client is ready
    if (!getIsInitialized(userId)) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client is not fully initialized or is not ready yet. Please wait.",
      });
    }

    await client.sendMessage(chatId, message, {
      quotedMessageId,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error during send personal message controller:", error);
    
    // Auto-teardown client if browser session gets detached or crashed
    if (error.message && (error.message.includes("detached Frame") || error.message.includes("Target closed") || error.message.includes("Session closed"))) {
      console.warn(`[User ${userId}] Detached frame or browser crash detected. Automatically tearing down WhatsApp client...`);
      closeWhatsApp(userId).catch((err) => console.error("Error tearing down WhatsApp client after crash:", err));
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function sendMediaPersonalController(req, res) {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const client = getClient(userId);
    if (!client) {
      return res.status(404).json({ success: false, message: "WhatsApp client not found for this user. Please login first." });
    }

    const { chatId, caption } = req.body;
    const file = req.file; // From multer middleware

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Receiver number is required",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file type",
      });
    }

    // Check if client is initialized
    if (!getIsInitialized(userId)) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client is not fully initialized or is not ready yet. Please wait.",
      });
    }

    console.log(`Sending media (${file.mimetype}) to: ${chatId}`);

    await sendMedia(client, chatId, file, caption);

    return res.status(200).json({
      success: true,
      message: "Media file sent successfully",
      file: {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Error in sendMediaController:", error);
    
    // Auto-teardown client if browser session gets detached or crashed
    if (error.message && (error.message.includes("detached Frame") || error.message.includes("Target closed") || error.message.includes("Session closed"))) {
      console.warn(`[User ${userId}] Detached frame or browser crash detected in media controller. Automatically tearing down WhatsApp client...`);
      closeWhatsApp(userId).catch((err) => console.error("Error tearing down WhatsApp client after media crash:", err));
    }

    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while sending media",
    });
  }
}

module.exports = {
  sendMessageController,
  sendMediaPersonalController,
};
