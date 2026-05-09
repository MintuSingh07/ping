const express = require("express");
const {
  sendMessagePersonalController,
  sendMediaPersonalController,
} = require("../../controllers/send-message/controller.send.message.whatsapp.");

const whatsAppMiddleware = require("../../middlewares/whatsapp.middleware");
const upload = require("../../middlewares/upload.middleware");

const router = express.Router();

router.post("/send-message", whatsAppMiddleware, sendMessagePersonalController);

// New route for sending media files
router.post(
  "/send-media",
  whatsAppMiddleware,
  upload.single("file"),
  sendMediaPersonalController,
);

module.exports = router;
