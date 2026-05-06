const { Client, LocalAuth } = require("whatsapp-web.js");

// Initialize client with optimized Puppeteer settings
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

const qrcode = require("qrcode-terminal");
const socketService = require("./socket.service");

let isInitialized = false;
let lastQr = null;
let messageQueue = [];

// Global event listeners
client.on("qr", (qr) => {
  lastQr = qr;
  qrcode.generate(qr, { small: true });
  console.log("QR Code received (Scan this in WhatsApp)");
});

client.on("ready", () => {
  console.log("WhatsApp Client is ready!");
  lastQr = null;
});

client.on("message", (msg) => {
  console.log("Message received:", msg.body);
  
  const messageData = {
    from: msg.from,
    body: msg.body,
    timestamp: new Date(),
  };

  // 1. Store in memory
  messageQueue.push(messageData);
  if (messageQueue.length > 100) messageQueue.shift();

  // 2. Emit via Socket.io for real-time updates
  socketService.emit("new_message", messageData);
});

client.on("authenticated", () => {
  console.log("WhatsApp Authentication successful");
});

client.on("auth_failure", (msg) => {
  console.error("WhatsApp Authentication failed:", msg);
});

client.on("disconnected", (msg) => {
  console.log("WhatsApp Client disconnected:", msg);
  isInitialized = false;
});

// Helper function to initialize the client
const initializeWhatsApp = async () => {
  if (isInitialized) return;
  console.log("Initializing WhatsApp client...");
  try {
    await client.initialize();
    isInitialized = true;
    
    // Wait for the browser page to be available
    let attempts = 0;
    while (!client.pupPage && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
  } catch (error) {
    console.error("WhatsApp initialization error:", error);
    throw error;
  }
};

// Exporting the client, initialization function, and state
module.exports = {
  client,
  initializeWhatsApp,
  getIsInitialized: () => isInitialized,
  getLastQr: () => lastQr,
  getMessages: () => messageQueue,
};
