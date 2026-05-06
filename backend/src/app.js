const express = require("express");
require("dotenv").config();
const whatsappAuthRouter = require("./routes/auth/route.auth.whatsapp");
const sendMessageRouter = require("./routes/send-message/route.send.message.whatsapp");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", whatsappAuthRouter);
app.use("/whatsapp", sendMessageRouter);

module.exports = app;
