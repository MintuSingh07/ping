const express = require("express");
const {
  checkSessionController,
  sendCodeController,
  verifyCodeController,
  qrLoginController,
  qrSubmitPasswordController,
} = require("../../controllers/telegram/auth.controller");
const authenticateSWT = require("../../middlewares/ping/auth.middleware");

const router = express.Router();

// Route to check if Telegram is already authorized
router.get("/status", authenticateSWT, checkSessionController);

// Routes for phone-based login flow
router.post("/login/phone/send-code", authenticateSWT, sendCodeController);
router.post("/login/phone/verify-code", authenticateSWT, verifyCodeController);

// Routes for QR code login flow
router.get("/login/qr", authenticateSWT, qrLoginController);
router.post("/login/qr/password", authenticateSWT, qrSubmitPasswordController);

module.exports = router;
