const express = require("express");
const {
  summarizeVoiceController,
  summarizeTextController,
} = require("../../controllers/service-controller/controller.service");
const router = express.Router();

router.post("/summarize-voice", summarizeVoiceController);
router.post("/summarize-text", summarizeTextController);

module.exports = router;
