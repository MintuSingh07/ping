const path = require("path");
const fs = require("fs");
const socketService = require("../services/socket.service");

const registerWhatsAppHandlers = (client, stateManager) => {
  // Ensure uploads directory exists
  const uploadsPath = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  client.on("message", async (msg) => {
    try {
      if (
        msg.from === "status@broadcast" ||
        msg.from.includes("@newsletter") ||
        (!msg.hasMedia &&
          msg.body === "" &&
          msg.type !== "audio" &&
          msg.type !== "ptt")
      )
        return;

      const contact = await msg.getContact();
      console.log(`New message from ${contact.name || msg.from}: ${msg.body}`);
      console.log(`Message ID: ${msg.id._serialized}`);
      console.log("Push Name : ", contact.pushname);

      // Check for media and store locally in /uploads
      if (msg.hasMedia || msg.type == "audio" || msg.type == "ptt") {
        try {
          const media = await msg.downloadMedia();

          if (media) {
            const buffer = Buffer.from(media.data, "base64");
            const cleanMimeType = media.mimetype.split(";")[0];
            const extension = cleanMimeType.split("/")[1];

            // Avoid double extensions if media.filename already has one
            const filename =
              media.filename && media.filename.includes(".")
                ? `${msg.id._serialized}_${media.filename}`
                : `${msg.id._serialized}${media.filename ? `_${media.filename}` : ""}.${extension}`;

            console.log("Filename is: ", filename);
            const filepath = path.join(uploadsPath, filename);
            fs.writeFileSync(filepath, buffer);
          }
        } catch (mediaError) {
          console.error("Error downloading media:", mediaError);
        }
      }

      const messageData = {
        chatId: msg.from,
        messageId: msg.id._serialized,
        savedName: contact.name,
        pushName: contact.pushname,
        body: msg.body,
        timestamp: new Date(),
      };

      stateManager.addMessage(messageData);
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
    stateManager.setInitialized(false);
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`⏳ WhatsApp Loading: ${percent}% - ${message}`);
  });

  client.on("ready", () => {
    console.log("🚀 WhatsApp Client is ready!");
    stateManager.setInitialized(true);
  });

  client.on("disconnected", (msg) => {
    console.log("🔌 WhatsApp Client disconnected:", msg);
    stateManager.setInitialized(false);
  });
};

module.exports = registerWhatsAppHandlers;
