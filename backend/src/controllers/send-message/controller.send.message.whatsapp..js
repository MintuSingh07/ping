const { client } = require("../../services/whatsapp.service");
const { formatNumber } = require("../../services/formatnumber");
const { sendMedia } = require("../../services/media.service");

async function sendMessagePersonalController(req, res) {
  try {
    const { number, message, quotedMessageId } = req.body;

    if (!number) {
      return res
        .status(400)
        .json({ success: false, message: "Number is required" });
    }

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const { number: formattedNumber, success } = formatNumber(number);
    if (!success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number" });
    }

    console.log(`Sending message to: ${formattedNumber}`);

    // Ensure the browser page is ready
    if (!client.pupPage) {
      throw new Error(
        "WhatsApp browser page not ready. Please try again in a moment.",
      );
    }

    // Format as JID for whatsapp-web.js
    const chatId = formattedNumber.includes("@c.us")
      ? formattedNumber
      : `${formattedNumber}@c.us`;

    await client.sendMessage(chatId, message, {
      quotedMessageId,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error during send personal message controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function sendMediaPersonalController(req, res) {
  try {
    const { number, caption, quotedMessageId } = req.body;
    const file = req.file; // From multer middleware

    if (!number) {
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

    const { number: formattedNumber, success } = formatNumber(number);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Check if client is initialized
    if (!client.pupPage) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client is not fully initialized. Please wait.",
      });
    }

    const chatId = `${formattedNumber}@c.us`;

    console.log(`Sending media (${file.mimetype}) to: ${chatId}`);

    const options = {};
    if (quotedMessageId) {
      options.quotedMessageId = quotedMessageId;
    }

    await sendMedia(client, chatId, file, caption, quotedMessageId);

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
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while sending media",
    });
  }
}

async function sendMessageGroupController(req, res) {
  console.log("Groupe Message");
}

module.exports = {
  sendMessagePersonalController,
  sendMessageGroupController,
  sendMediaPersonalController,
};
