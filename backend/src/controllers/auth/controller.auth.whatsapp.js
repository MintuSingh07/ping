const {
  client,
  getLastQr,
  getIsInitialized,
} = require("../../services/whatsapp.service");
const { formatNumber } = require("../../services/formatnumber");

async function whatsappLoginQrController(req, res) {
  try {
    const qr = getLastQr();

    if (qr) {
      return res.status(200).json({
        success: true,
        qr: qr,
        message: "QR code available. Scan it in WhatsApp.",
      });
    }

    if (getIsInitialized()) {
      const state = await client.getState();
      if (state === "CONNECTED") {
        return res.status(200).json({
          success: true,
          message: "WhatsApp is already connected.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "WhatsApp is initializing. Please wait for the QR code.",
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
