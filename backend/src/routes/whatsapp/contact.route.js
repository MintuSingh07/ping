const express = require("express");
const {
  searchContactsController,
} = require("../../controllers/whatsapp/contact.controller");
const whatsAppMiddleware = require("../../middlewares/whatsapp/whatsapp.middleware");

const router = express.Router();

// GET /api/whatsapp/contact/search?query=name
router.get("/search", whatsAppMiddleware, searchContactsController);

module.exports = router;
