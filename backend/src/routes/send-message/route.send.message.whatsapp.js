const express = require("express");
const {
  sendMessageController,
} = require("../../controllers/send-message/controller.send.message.whatsapp.");

const router = express.Router();

router.post("/send-message", sendMessageController);

module.exports = router;
