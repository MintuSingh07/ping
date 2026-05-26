const mongoose = require("mongoose");
require("dotenv").config(); // Ensure env is loaded even if this file is used standalone

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ping";

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for clearer error messages
    });
    console.log(`[+] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[-] MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
