const express = require("express");
const {
  whatsappLoginQrController,
  whatsappPairCodeLoginController,
} = require("../../controllers/whatsapp/auth.controller");

const router = express.Router();

router.get("/login/whatsapp/qr", whatsappLoginQrController);
router.post("/login/whatsapp/pair-code", whatsappPairCodeLoginController);
module.exports = router;
