const express = require("express");
const {
  whatsappLoginQrController,
  whatsappPairCodeLoginController,
} = require("../../controllers/auth/auth.controller.whatsapp");

const router = express.Router();

router.get("/login/whatsapp/qr", whatsappLoginQrController);
router.post("/login/whatsapp/pair-code", whatsappPairCodeLoginController);
module.exports = router;
