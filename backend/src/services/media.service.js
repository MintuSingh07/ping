const { MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");

const sendMedia = async (client, chatId, file, caption = "") => {
  try {
    if (!fs.existsSync(file.path)) {
      throw new Error("File not found on server");
    }

    const media = MessageMedia.fromFilePath(file.path);
    
    await client.sendMessage(chatId, media, { 
      caption: caption || "",
      sendMediaAsDocument: file.mimetype === "application/pdf" // Send PDFs as documents
    });

    // Cleanup: Delete the file from the uploads folder after sending
    fs.unlink(file.path, (err) => {
      if (err) console.error(`Failed to delete temp file: ${file.path}`, err);
    });

    return { success: true };
  } catch (error) {
    console.error("Media Service Error:", error);
    // Cleanup even on error
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
};

module.exports = { sendMedia };
