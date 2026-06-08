const express = require("express");
const {
  whatsappLoginQrController,
  whatsappPairCodeLoginController,
} = require("../../controllers/whatsapp/auth.controller");
const requireDPoP = require("../../middlewares/ping/dpop.middleware");

const router = express.Router();

router.get("/login/whatsapp/qr", requireDPoP, whatsappLoginQrController);
router.post("/login/whatsapp/pair-code", requireDPoP, whatsappPairCodeLoginController);
module.exports = router;
