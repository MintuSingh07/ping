const qrcode = require("qrcode-terminal");
const {
  client,
  getIsInitialized,
  initializeWhatsApp,
} = require("../../services/whatsapp.service");
const { formatNumber } = require("../../services/formatnumber");

async function whatsappLoginQrController(req, res) {
  try {
    // 1. Check if already connected
    if (getIsInitialized()) {
      try {
        const state = await client.getState();
        if (state === "CONNECTED") {
          return res.status(200).json({
            success: true,
            authenticated: true,
            message: "WhatsApp is already connected.",
          });
        }
      } catch (e) {}
    }

    // 2. Set up a one-time listener for the QR code
    // This only prints to terminal when THIS API is called
    const qrPromise = new Promise((resolve) => {
      client.once("qr", (qr) => {
        qrcode.generate(qr, { small: true });
        console.log("QR Code received (Scan this in WhatsApp)");
        resolve(qr);
      });

      // If a QR is already pending or we are already initializing,
      // it will be caught by this 'once' listener when emitted.
      // We add a timeout so the API doesn't hang forever
      setTimeout(() => resolve(null), 30000);
    });

    // 3. Trigger/Ensure initialization
    await initializeWhatsApp();

    // 4. Wait for the QR to be emitted
    const qr = await qrPromise;

    if (qr) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        qr: qr,
        message: "QR code printed in terminal and sent in response.",
      });
    }

    return res.status(202).json({
      success: true,
      authenticated: false,
      message:
        "WhatsApp is initializing or already connected. If no QR appeared in terminal, please check server status.",
    });
  } catch (error) {
    console.error("Error during QR login controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function whatsappPairCodeLoginController(req, res) {
  try {
    const { number } = req.body;
    if (!number) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    const { number: formattedNumber, success } = formatNumber(number);
    if (!success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number" });
    }

    console.log(`Requesting pairing code for: ${formattedNumber}`);

    if (!client.pupPage) {
      throw new Error(
        "WhatsApp browser page not ready. Please try again in a moment.",
      );
    }

    // Request pairing code with a timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Pairing code request timed out. Make sure you are not already logged in.",
            ),
          ),
        20000,
      ),
    );

    const pairingCode = await Promise.race([
      client.requestPairingCode(formattedNumber),
      timeoutPromise,
    ]);

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
