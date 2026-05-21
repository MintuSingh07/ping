const express = require("express");
const {
  getChatsController,
  getMessagesController,
} = require("../../controllers/whatsapp/chat.controller");
const whatsAppMiddleware = require("../../middlewares/whatsapp/whatsapp.middleware");

const router = express.Router();

// GET /api/whatsapp/chat
// Fetches the list of all recent chats
router.get("/", whatsAppMiddleware, getChatsController);

// GET /api/whatsapp/chat/:chatId/messages
// Fetches historical messages for a specific chat
router.get("/:chatId/messages", whatsAppMiddleware, getMessagesController);

module.exports = router;
