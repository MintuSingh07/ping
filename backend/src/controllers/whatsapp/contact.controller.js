const { getClient } = require("../../services/whatsapp/whatsapp.service");

async function searchContactsController(req, res) {
  try {
    const userId = req.currentUserId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const client = getClient(userId);
    if (!client) {
      return res.status(404).json({ success: false, message: "WhatsApp client not found for this user. Please login first." });
    }

    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    // Ensure the browser page is ready
    if (!client.pupPage) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client is not fully initialized. Please wait.",
      });
    }

    const lowerQuery = query.toLowerCase();

    // Fetch contacts and chats
    const contacts = await client.getContacts();
    const chats = await client.getChats();

    // Filter contacts (Saved Names) with deduplication
    const filteredContacts = [];
    const seenIds = new Set();
    
    contacts.forEach((contact) => {
      if (contact.name && !contact.isGroup) {
        if (contact.name.toLowerCase().includes(lowerQuery)) {
          const id = contact.id._serialized;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            filteredContacts.push(contact);
          }
        }
      }
    });

    // Filter groups (Group Names)
    const filteredGroups = chats.filter((chat) => {
      // Only return chats that are groups and match the query
      if (chat.isGroup && chat.name) {
        return chat.name.toLowerCase().includes(lowerQuery);
      }
      return false;
    });

    return res.status(200).json({
      success: true,
      contacts: filteredContacts.map((c) => ({
        id: c.id._serialized,
        name: c.name,
        number: c.number,
      })),
      groups: filteredGroups.map((g) => ({
        id: g.id._serialized,
        name: g.name,
        participants: g.participants ? g.participants.length : 0,
      })),
    });
  } catch (error) {
    console.error("Error during search contacts controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  searchContactsController,
};
