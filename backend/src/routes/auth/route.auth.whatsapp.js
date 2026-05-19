const express = require("express");
const {
  whatsappLoginQrController,
  whatsappPairCodeLoginController,
} = require("../../controllers/auth/controller.auth.whatsapp");

const router = express.Router();

router.post("/login/whatsapp/qr", whatsappLoginQrController);
router.post("/login/whatsapp/pair-code", whatsappPairCodeLoginController);
module.exports = router;
