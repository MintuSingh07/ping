const express = require("express");
require("dotenv").config();
const whatsappAuthRouter = require("./routes/auth/auth.route.whatsapp");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", whatsappAuthRouter);

module.exports = app;
