const express = require("express");
const {
  whatsappLoginQrController,
  whatsappPairCodeLoginController,
} = require("../../controllers/whatsapp/auth.controller");
const authenticateSWT = require("../../middlewares/ping/auth.middleware");

const router = express.Router();

router.get("/login/whatsapp/qr", authenticateSWT, whatsappLoginQrController);
router.post("/login/whatsapp/pair-code", authenticateSWT, whatsappPairCodeLoginController);
module.exports = router;
