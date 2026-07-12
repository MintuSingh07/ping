const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const socketService = require("../../services/socket.service");

const registerWhatsAppHandlers = (client, stateManager, userId) => {
  // Ensure uploads directory exists
  const uploadsPath = path.join(__dirname, "../../../uploads", userId);
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
      console.log(`[User ${userId}] New message from ${contact.name || msg.from}: ${msg.body}`);
      console.log(`[User ${userId}] Message ID: ${msg.id._serialized}`);
      console.log(`[User ${userId}] Push Name : `, contact.pushname);

      // Check for media and store locally in /uploads/userId
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

            console.log(`[User ${userId}] Filename is: `, filename);

            let mediaTypeFolder = "other";
            if (cleanMimeType.startsWith("audio") || msg.type === "audio" || msg.type === "ptt") {
              mediaTypeFolder = "audio";
            } else if (cleanMimeType.startsWith("video") || msg.type === "video") {
              mediaTypeFolder = "video";
            } else if (cleanMimeType.startsWith("image") || msg.type === "image") {
              mediaTypeFolder = "image";
            }

            const targetDir = path.join(__dirname, "../../../uploads", userId, msg.from, mediaTypeFolder);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            const filepath = path.join(targetDir, filename);
            fs.writeFileSync(filepath, buffer);
          }
        } catch (mediaError) {
          console.error(`[User ${userId}] Error downloading media:`, mediaError);
        }
      }

      let quotedMsgData = null;
      if (msg.hasQuotedMsg) {
        try {
          const quotedMsg = await msg.getQuotedMessage();
          if (quotedMsg) {
            const quotedContact = await quotedMsg.getContact();
            quotedMsgData = {
              body: quotedMsg.body,
              type: quotedMsg.type,
              author: quotedMsg.author || quotedMsg.from,
              senderName: quotedContact ? (quotedContact.name || quotedContact.pushname) : null,
              id: quotedMsg.id._serialized,
            };
          }
        } catch (quotedErr) {
          console.error(`[User ${userId}] Error getting quoted message:`, quotedErr);
        }
      }

      const messageData = {
        userId,
        chatId: msg.from,
        senderJid: msg.author || msg.from,
        messageId: msg.id._serialized,
        savedName: contact.name,
        pushName: contact.pushname,
        body: msg.body,
        timestamp: new Date(),
        quotedMsg: quotedMsgData,
        platform: "whatsapp",
      };

      stateManager.addMessage(messageData);
      // Emit ONLY to the room for this specific user
      socketService.emitToUser(userId, "new_message", messageData);
    } catch (err) {
      console.error(`[User ${userId}] Error in message listener:`, err);
    }
  });

  client.on("qr", (qr) => {
    stateManager.setQr(qr);
    qrcode.generate(qr, { small: true });
    console.log(`[User ${userId}] QR Code received/refreshed (Scan this in WhatsApp)`);
    socketService.emitToUser(userId, "whatsapp_qr", { qr });
  });

  client.on("authenticated", () => {
    console.log(`✅ [User ${userId}] WhatsApp Authentication successful! Syncing data...`);
    // Note: We wait for the 'ready' event to mark it completely authenticated and active.
  });

  client.on("auth_failure", (msg) => {
    console.error(`❌ [User ${userId}] WhatsApp Authentication failed:`, msg);
    stateManager.setInitialized(false);
    stateManager.setAuthenticated(false);
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`⏳ [User ${userId}] WhatsApp Loading: ${percent}% - ${message}`);
  });

  client.on("ready", async () => {
    console.log(`🚀 [User ${userId}] WhatsApp Client is ready!`);
    stateManager.setQr(null); // Clear QR code since connected
    stateManager.setInitialized(true);
    stateManager.setAuthenticated(true);

    try {
      const User = require("../../models/user.model");
      const phone = client.info?.wid?.user || "";
      const pushname = client.info?.pushname || "";

      await User.findByIdAndUpdate(userId, {
        $set: {
          "integrations.whatsapp.connected": true,
          "integrations.whatsapp.phoneNumber": phone,
          "integrations.whatsapp.pushName": pushname,
          "integrations.whatsapp.connectedAt": new Date(),
        }
      });
      console.log(`[+] Database updated: User ${userId} WhatsApp marked connected.`);
      
      socketService.emitToUser(userId, "whatsapp_connected", {
        connected: true,
        phoneNumber: phone,
        pushName: pushname
      });
    } catch (dbErr) {
      console.error(`[-] Failed to update WhatsApp integration state in database for user ${userId}:`, dbErr);
    }
  });

  client.on("disconnected", async (msg) => {
    console.log(`🔌 [User ${userId}] WhatsApp Client disconnected:`, msg);
    stateManager.setQr(null); // Clear QR code
    stateManager.setInitialized(false);
    stateManager.setAuthenticated(false);

    try {
      const User = require("../../models/user.model");
      await User.findByIdAndUpdate(userId, {
        $set: {
          "integrations.whatsapp.connected": false,
          "integrations.whatsapp.phoneNumber": "",
          "integrations.whatsapp.pushName": "",
          "integrations.whatsapp.connectedAt": null,
        }
      });
      console.log(`[-] Database updated: User ${userId} WhatsApp marked disconnected.`);
      
      socketService.emitToUser(userId, "whatsapp_disconnected", {
        connected: false
      });
    } catch (dbErr) {
      console.error(`[-] Failed to clear WhatsApp integration state in database for user ${userId}:`, dbErr);
    }
  });
};

module.exports = registerWhatsAppHandlers;
