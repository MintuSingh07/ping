const express = require("express");
const {
  checkSessionController,
  sendCodeController,
  verifyCodeController,
  qrLoginController,
  qrSubmitPasswordController,
} = require("../../controllers/telegram/auth.controller");
const requireDPoP = require("../../middlewares/ping/dpop.middleware");

const router = express.Router();

// Route to check if Telegram is already authorized
router.get("/status", requireDPoP, checkSessionController);

// Routes for phone-based login flow
router.post("/login/phone/send-code", requireDPoP, sendCodeController);
router.post("/login/phone/verify-code", requireDPoP, verifyCodeController);

// Routes for QR code login flow
router.get("/login/qr", requireDPoP, qrLoginController);
router.post("/login/qr/password", requireDPoP, qrSubmitPasswordController);

module.exports = router;
