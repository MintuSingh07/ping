const {
  client,
} = require("../../services/whatsapp.service");
const { formatNumber } = require("../../services/formatnumber");

async function sendMessageController(req, res) {
  try {
    const { number, message } = req.body;

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

    await client.sendMessage(chatId, message);


    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error during send message controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = { sendMessageController };
