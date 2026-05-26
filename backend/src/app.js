const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const pingAuthRouter = require("./routes/ping/auth.route");
const whatsappAuthRouter = require("./routes/whatsapp/auth.route");
const sendMessageRouter = require("./routes/whatsapp/message.route");
const contactRouter = require("./routes/whatsapp/contact.route");
const chatRouter = require("./routes/whatsapp/chat.route");
const serviceRouter = require("./routes/service-route/route.service");
const telegramAuthRouter = require("./routes/telegram/auth.route");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping signup / Signin
app.use("/api/ping/auth", pingAuthRouter);

// Whatsapp Controls
app.use("/api/whatsapp/auth", whatsappAuthRouter);
app.use("/api/whatsapp/message", sendMessageRouter);
app.use("/api/whatsapp/chat", chatRouter);
app.use("/api/whatsapp/contact", contactRouter);

// Telegram Controls
app.use("/api/telegram/auth", telegramAuthRouter);

// Generic services
app.use("/api/service", serviceRouter);

module.exports = app;
