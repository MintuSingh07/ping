const express = require("express");
require("dotenv").config();
const whatsappAuthRouter = require("./routes/whatsapp/auth.route");
const sendMessageRouter = require("./routes/whatsapp/message.route");
const contactRouter = require("./routes/whatsapp/contact.route");
const chatRouter = require("./routes/whatsapp/chat.route");
const serviceRouter = require("./routes/service-route/route.service");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Whatsapp Controls
app.use("/api/whatsapp/auth", whatsappAuthRouter);
app.use("/api/whatsapp/message", sendMessageRouter);
app.use("/api/whatsapp/contact", contactRouter);
app.use("/api/whatsapp/chat", chatRouter);

// Generic services
app.use("/api/service", serviceRouter);

module.exports = app;
