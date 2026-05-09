const express = require("express");
const {
  sendMessageController,
} = require("../../controllers/send-message/controller.send.message.whatsapp.");

const whatsAppMiddleware = require("../../middlewares/whatsapp.middleware");

const router = express.Router();

router.post("/send-message", whatsAppMiddleware, sendMessageController);

module.exports = router;
