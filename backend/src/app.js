const express = require("express");
require("dotenv").config();
const whatsappAuthRouter = require("./routes/whatsapp/auth.route");
const sendMessageRouter = require("./routes/whatsapp/message.route");
const serviceRouter = require("./routes/service-route/route.service");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Whatsapp Controls
app.use("/api/auth", whatsappAuthRouter);
app.use("/api/whatsapp", sendMessageRouter);
app.use("/api/service", serviceRouter);

module.exports = app;
