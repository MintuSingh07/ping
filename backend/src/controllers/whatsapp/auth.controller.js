
const {
  getClient,
  getIsInitialized,
  initializeWhatsApp,
  getOrCreateClientState,
} = require("../../services/whatsapp/whatsapp.service");
const { formatNumber } = require("../../services/formatnumber");

async function whatsappLoginQrController(req, res) {
  try {
    // TODO: Extract userId from your SWT Auth Middleware once built
    // For now, we fallback to req.body.userId or headers
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    // 1. Check if already connected for THIS user
    if (getIsInitialized(userId)) {
      try {
        const client = getClient(userId);
        const state = await client.getState();
        if (state === "CONNECTED") {
          return res.status(200).json({
            success: true,
            authenticated: true,
            message: "WhatsApp is already connected for this user.",
          });
        }
      } catch (e) {}
    }

    // 3. Trigger/Ensure initialization for THIS user
    const state = getOrCreateClientState(userId);
    const client = state.client;

    if (state.qr) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        qr: state.qr,
        message: "QR code returned from active session state.",
      });
    }

    const qrPromise = new Promise((resolve) => {
      const onQr = (qr) => {
        cleanup();
        resolve(qr);
      };
      
      const onReady = () => {
        cleanup();
        resolve(null);
      };
      
      const onAuthFailure = () => {
        cleanup();
        resolve(null);
      };

      const cleanup = () => {
        client.off("qr", onQr);
        client.off("ready", onReady);
        client.off("auth_failure", onAuthFailure);
      };

      client.once("qr", onQr);
      client.once("ready", onReady);
      client.once("auth_failure", onAuthFailure);

      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 30000);
    });

    // Start initialization. We do NOT await it immediately, so the listeners can catch the events.
    initializeWhatsApp(userId);

    // 4. Wait for the QR or Ready event
    const qr = await qrPromise;

    if (qr) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        qr: qr,
        message: "QR code generated and sent in response.",
      });
    }

    // If no QR was returned, check if the client is ready
    if (getIsInitialized(userId)) {
      return res.status(200).json({
        success: true,
        authenticated: true,
        message: "WhatsApp connected successfully.",
      });
    }

    return res.status(202).json({
      success: true,
      authenticated: false,
      message:
        "WhatsApp is initializing or already connected. If no QR appeared in terminal, please check server status",
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
    const userId = req.user?.id || req.body?.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

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

    console.log(`[User ${userId}] Requesting pairing code for: ${formattedNumber}`);

    // Ensure client is initialized
    await initializeWhatsApp(userId);
    const client = getClient(userId);

    if (!client || !client.pupPage) {
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

    console.log(`[User ${userId}] 🔑 Pairing Code generated:`, pairingCode);

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
