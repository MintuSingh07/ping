const { getClient, getIsInitialized } = require("../../services/whatsapp/whatsapp.service");

async function getChatsController(req, res) {
  try {
    const userId = req.currentUserId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const client = getClient(userId);
    if (!client || !getIsInitialized(userId)) {
      return res.status(503).json({ success: false, message: "WhatsApp client is not ready. Please wait." });
    }

    const chats = await client.getChats();

    const mappedChats = await Promise.all(
      chats.map(async (chat) => {
        let isOnline = false;
        let lastSeen = null;
        let avatar = "";
        let isBusiness = false;
        let verifiedName = null;

        // Try to fetch profile picture URL for any chat
        try {
          avatar = await client.getProfilePicUrl(chat.id._serialized) || "";
        } catch (picErr) {
          // Ignore profile pic fetch failures
        }

        if (!chat.isGroup) {
          try {
            const contact = await chat.getContact();
            isBusiness = contact.isBusiness || false;
            verifiedName = contact.verifiedName || null;

            if (typeof contact.getPresence === "function") {
              const presence = await contact.getPresence();
              if (presence) {
                isOnline = presence.isOnline || false;
                lastSeen = presence.lastSeen || null;
              }
            }
          } catch (e) {
            // Ignore contact lookup failures
          }
        }

        const displayName = verifiedName || chat.name || chat.id.user;

        return {
          id: chat.id._serialized,
          name: displayName,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          timestamp: chat.timestamp,
          pinned: chat.pinned,
          archived: chat.archived,
          isOnline,
          lastSeen,
          avatar,
          isBusiness,
          verifiedName,
          lastMessage: chat.lastMessage ? {
            body: chat.lastMessage.body,
            type: chat.lastMessage.type,
            timestamp: chat.lastMessage.timestamp,
          } : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      chats: mappedChats,
    });
  } catch (error) {
    console.error("Error during get chats controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getMessagesController(req, res) {
  try {
    const userId = req.currentUserId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const client = getClient(userId);
    if (!client || !getIsInitialized(userId)) {
      return res.status(503).json({ success: false, message: "WhatsApp client is not ready. Please wait." });
    }

    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ success: false, message: "chatId parameter is required." });
    }

    // Default limit per page is 100
    const limit = 100;
    const page = parseInt(req.query.page, 10) || 1;
    
    // We tell whatsapp-web.js to fetch enough messages to cover our page
    const fetchLimit = limit * page;

    const chat = await client.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    const messages = await chat.fetchMessages({ limit: fetchLimit });

    // Slice the array to only return the specific "page" of 100 messages
    const startIndex = messages.length - (page * limit);
    const endIndex = messages.length - ((page - 1) * limit);
    const pageMessages = messages.slice(Math.max(0, startIndex), endIndex);

    const mappedMessages = pageMessages.map((msg) => ({
      id: msg.id._serialized,
      body: msg.body,
      type: msg.type,
      timestamp: msg.timestamp,
      fromMe: msg.fromMe,
      hasMedia: msg.hasMedia,
      author: msg.author || msg.from,
    }));

    return res.status(200).json({
      success: true,
      page: page,
      messages: mappedMessages,
    });
  } catch (error) {
    console.error("Error during get messages controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  getChatsController,
  getMessagesController,
};
