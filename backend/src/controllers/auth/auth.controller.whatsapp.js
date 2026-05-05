const { Client, LocalAuth } = require("whatsapp-web.js");

// Initialize client with stable Puppeteer settings
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let isInitialized = false;

// Global event listeners (defined once)
client.on("ready", () => console.log("WhatsApp Client is ready!"));
client.on("authenticated", () => console.log("Authentication successful"));
client.on("auth_failure", (msg) => console.error("Authentication failed:", msg));
client.on("disconnected", (msg) => {
  console.log("Client disconnected:", msg);
  isInitialized = false;
});

// Helper function to ensure client is initialized
async function ensureClientInitialized() {
  if (!isInitialized) {
    console.log("Starting WhatsApp client...");
    await client.initialize();
    isInitialized = true;

    // Wait for internal browser page to be ready
    let attempts = 0;
    while (!client.pupPage && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }
  }
}

async function whatsappLoginQrController(req, res) {
  try {
    await ensureClientInitialized();

    // Listen for the next QR code
    client.once("qr", (qr) => {
      console.log("QR Code received (Scan this in WhatsApp):", qr);
    });

    return res.status(200).json({
      success: true,
      message: "Whatsapp initialized. Check your terminal for the QR code.",
    });
  } catch (error) {
    console.error("Error during QR login:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

async function whatsappPairCodeLoginController(req, res) {
  try {
    let { number } = req.body;
    if (!number)
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });

    // format number by removing + from 91 and any gaps
    number = number.replace(/\s/g, "");
    number = number.replace("+91", "");
    number = "91" + number;
    console.log("Formatted number:", number);

    await ensureClientInitialized();

    if (!client.pupPage) {
      throw new Error("Browser took too long to initialize. Please try again.");
    }

    console.log(`Requesting pairing code for: ${number}`);
    const pairingCode = await client.requestPairingCode(number);
    console.log("🔑 Pairing Code generated:", pairingCode);

    return res.status(200).json({
      success: true,
      message: "Pairing code generated successfully",
      pairingCode: pairingCode,
    });
  } catch (error) {
    console.error("Error during pairing code generation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = { whatsappLoginQrController, whatsappPairCodeLoginController };
