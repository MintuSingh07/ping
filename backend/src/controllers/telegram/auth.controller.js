const { Api } = require("telegram");
const {
  getOrCreateClientState,
  initializeTelegram,
  checkSessionExists,
  getClient,
} = require("../../services/telegram/telegram.service");
const socketService = require("../../services/socket.service");
const qrcode = require("qrcode-terminal");

const getApiCredentials = () => {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  return {
    apiId: apiId ? Number(apiId) : null,
    apiHash: apiHash || null,
  };
};

/**
 * Controller to check if a Telegram session exists and is authorized for this user
 */
async function checkSessionController(req, res) {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const sessionExists = checkSessionExists(userId);
    if (!sessionExists) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        message: "No active Telegram session found.",
      });
    }

    // Attempt to initialize and connect to verify authorization status
    try {
      await initializeTelegram(userId);
      const client = getClient(userId);
      const isAuthorized = await client.isUserAuthorized();

      if (isAuthorized) {
        return res.status(200).json({
          success: true,
          authenticated: true,
          message: "Telegram is already connected and authorized for this user.",
        });
      }
    } catch (err) {
      console.warn(`[Telegram - User ${userId}] Error validating session status:`, err);
    }

    return res.status(200).json({
      success: true,
      authenticated: false,
      message: "Telegram session exists but is not authorized or expired.",
    });
  } catch (error) {
    console.error("Error during session check:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/**
 * Controller to send the phone code for mobile number login (Step 1 of Phone Auth)
 */
async function sendCodeController(req, res) {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    const { apiId, apiHash } = getApiCredentials();
    if (!apiId || !apiHash) {
      return res.status(400).json({
        success: false,
        message: "TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in server .env before calling Telegram API.",
      });
    }

    // Initialize and connect the Telegram Client
    await initializeTelegram(userId);
    const stateManager = getOrCreateClientState(userId);
    const client = stateManager.state.client;

    console.log(`[Telegram - User ${userId}] Sending OTP code to: ${phoneNumber}`);
    const result = await client.sendCode(
      { apiId, apiHash },
      phoneNumber
    );

    // Save state details
    stateManager.state.phoneNumber = phoneNumber;
    stateManager.state.phoneCodeHash = result.phoneCodeHash;

    return res.status(200).json({
      success: true,
      message: "Telegram login code sent successfully.",
      phoneCodeHash: result.phoneCodeHash,
    });
  } catch (error) {
    console.error("Error during send code:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/**
 * Controller to verify the phone code and log in (Step 2 of Phone Auth, supports 2FA)
 */
async function verifyCodeController(req, res) {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const { phoneCode, password } = req.body;
    if (!phoneCode) {
      return res.status(400).json({ success: false, message: "Verification code is required." });
    }

    const stateManager = getOrCreateClientState(userId);
    const { state } = stateManager;
    const client = state.client;

    if (!state.phoneNumber || !state.phoneCodeHash) {
      return res.status(400).json({
        success: false,
        message: "Phone number or code hash not found. Please trigger the /send-code endpoint first.",
      });
    }

    const { apiId, apiHash } = getApiCredentials();

    try {
      // Attempt manual sign-in via Telegram API
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: state.phoneNumber,
          phoneCodeHash: state.phoneCodeHash,
          phoneCode: phoneCode,
        })
      );

      if (result instanceof Api.auth.AuthorizationSignUpRequired) {
        return res.status(400).json({
          success: false,
          message: "Signup/registration is required for this number on Telegram. Direct signup not supported.",
        });
      }

      // Success! Persist session string and mark active
      stateManager.saveSession();
      stateManager.setInitialized(true);

      // Clean up temp state
      state.phoneNumber = null;
      state.phoneCodeHash = null;

      return res.status(200).json({
        success: true,
        authenticated: true,
        message: "Telegram login successful.",
      });
    } catch (err) {
      if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
        console.log(`[Telegram - User ${userId}] 2FA Password needed to complete phone sign-in.`);

        if (password) {
          // Attempt authentication using the provided 2FA cloud password
          try {
            await client.signInWithPassword(
              { apiId, apiHash },
              {
                password: async () => password,
                onError: (e) => {
                  throw e;
                },
              }
            );

            stateManager.saveSession();
            stateManager.setInitialized(true);

            // Clean up temp state
            state.phoneNumber = null;
            state.phoneCodeHash = null;

            return res.status(200).json({
              success: true,
              authenticated: true,
              message: "Telegram login successful with 2FA password.",
            });
          } catch (passErr) {
            return res.status(400).json({
              success: false,
              message: `2FA password validation failed: ${passErr.message}`,
            });
          }
        } else {
          // Notify client that password is required
          return res.status(202).json({
            success: true,
            authenticated: false,
            passwordRequired: true,
            message: "2FA cloud password is required to complete login.",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: err.message || "Authentication failed.",
        });
      }
    }
  } catch (error) {
    console.error("Error during code verification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/**
 * Controller to initialize and return the QR code login URI
 */
async function qrLoginController(req, res) {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const stateManager = getOrCreateClientState(userId);
    const { state } = stateManager;
    const client = state.client;

    // Check if already connected
    const sessionExists = checkSessionExists(userId);
    if (sessionExists) {
      try {
        await initializeTelegram(userId);
        const isAuthorized = await client.isUserAuthorized();
        if (isAuthorized) {
          return res.status(200).json({
            success: true,
            authenticated: true,
            message: "Telegram is already connected.",
          });
        }
      } catch (e) {}
    }

    // Ensure client is connected
    await initializeTelegram(userId);

    if (state.qr) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        qr: state.qr,
        message: "QR code returned from active login state.",
      });
    }

    const { apiId, apiHash } = getApiCredentials();
    if (!apiId || !apiHash) {
      return res.status(400).json({
        success: false,
        message: "TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in server .env before calling Telegram API.",
      });
    }

    // Launch the QR code sign-in flow in the background
    (async () => {
      try {
        await client.signInUserWithQrCode(
          { apiId, apiHash },
          {
            qrCode: async ({ token, expires }) => {
              const qrLink = `tg://login?token=${token.toString("base64url")}`;
              stateManager.setQr(qrLink);
              console.log(`[Telegram - User ${userId}] QR Link generated: ${qrLink}`);
              
              // Render the QR code directly in the terminal console
              qrcode.generate(qrLink, { small: true });

              // Stream the QR code update to the frontend client in real-time
              socketService.emitToUser(userId, "telegram_qr", { qr: qrLink });
            },
            password: async (hint) => {
              console.log(`[Telegram - User ${userId}] 2FA password requested during QR scan. Hint: ${hint}`);
              socketService.emitToUser(userId, "telegram_password_required", { hint });

              // Initialize the deferred promise
              state.passwordPromise = {};
              state.passwordPromise.promise = new Promise((resolve, reject) => {
                state.passwordPromise.resolve = resolve;
                state.passwordPromise.reject = reject;
              });

              // Set a 2-minute timeout for submitting password
              const timeout = setTimeout(() => {
                if (state.passwordPromise) {
                  state.passwordPromise.reject(new Error("2FA password submission timed out."));
                  state.passwordPromise = null;
                }
              }, 120000);

              try {
                const passwordVal = await state.passwordPromise.promise;
                clearTimeout(timeout);
                return passwordVal;
              } catch (err) {
                clearTimeout(timeout);
                throw err;
              }
            },
            onError: async (err) => {
              console.error(`[Telegram - User ${userId}] QR code login error callback:`, err);
              socketService.emitToUser(userId, "telegram_error", { message: err.message });
              return true; // Stop flow on error
            },
          }
        );

        // Flow finished successfully! Save session
        stateManager.clearQr();
        stateManager.saveSession();
        stateManager.setInitialized(true);

        socketService.emitToUser(userId, "telegram_ready", { success: true });
        console.log(`🚀 [Telegram - User ${userId}] Successfully logged in via QR Code!`);
      } catch (err) {
        console.error(`[Telegram - User ${userId}] QR Code background authorization failed:`, err);
        stateManager.clearQr();
        stateManager.setInitialized(false);
        socketService.emitToUser(userId, "telegram_auth_failure", { message: err.message });
      }
    })();

    // Wait up to 3 seconds for the initial QR link to be generated in the background thread
    for (let i = 0; i < 30; i++) {
      if (state.qr) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (state.qr) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        qr: state.qr,
        message: "QR code generated successfully.",
      });
    }

    return res.status(202).json({
      success: true,
      authenticated: false,
      message: "QR code login is initializing in the background. Connect to web sockets to receive updates.",
    });
  } catch (error) {
    console.error("Error during QR login initialization:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

/**
 * Controller to submit the 2FA password to complete QR code sign-in
 */
async function qrSubmitPasswordController(req, res) {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. userId is required." });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "2FA Password is required." });
    }

    const stateManager = getOrCreateClientState(userId);
    const { state } = stateManager;

    if (state.passwordPromise && state.passwordPromise.resolve) {
      console.log(`[Telegram - User ${userId}] Password received from route. Resolving pending 2FA challenge...`);
      state.passwordPromise.resolve(password);
      state.passwordPromise = null;

      return res.status(200).json({
        success: true,
        message: "2FA Password submitted successfully. Completing authentication...",
      });
    }

    return res.status(400).json({
      success: false,
      message: "No pending 2FA password request found for your active QR login flow.",
    });
  } catch (error) {
    console.error("Error submitting 2FA password:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  checkSessionController,
  sendCodeController,
  verifyCodeController,
  qrLoginController,
  qrSubmitPasswordController,
};
