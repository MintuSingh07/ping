const express = require("express");
const router = express.Router();
const { registerPing, loginPing, logoutPing, verifyOtpPing, resendOtpPing } = require("../../controllers/ping/auth.controller");
const authenticateSWT = require("../../middlewares/ping/auth.middleware");

// Public routes
router.post("/register", registerPing);
router.post("/login", loginPing);
router.post("/logout", logoutPing);
router.post("/verify-otp", verifyOtpPing);
router.post("/resend-otp", resendOtpPing);

// Protected route — just send Bearer token in Authorization header
router.get("/me", authenticateSWT, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      status: req.user.status,
      integrations: req.user.integrations,
    },
  });
});

module.exports = router;
