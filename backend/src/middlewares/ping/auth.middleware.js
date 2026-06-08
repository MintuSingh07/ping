const { verify } = require("secure-web-token");
const User = require("../../models/user.model");
const { redisStore } = require("../../utils/redis.util");

const SWT_SECRET = process.env.SWT_SECRET;

/**
 * SWT Authentication Middleware (per SWT docs)
 * Checks: Bearer token + HttpOnly session cookie + device fingerprint
 */
async function authenticateSWT(req, res, next) {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }
    const token = authHeader.split(" ")[1];

    // 2. Get sessionId from HttpOnly cookie
    const sessionId = req.cookies.swt_session;
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Session cookie missing.",
      });
    }

    // 3. Verify token (decrypts + checks session + checks DPoP proof in Redis/headers)
    let payload;
    try {
      payload = await verify(token, SWT_SECRET, {
        sessionId: sessionId || undefined,
        store: redisStore || undefined,
        dpopProof: req.headers["x-dpop-proof"] || undefined,
      });
    } catch (verifyError) {
      return res.status(401).json({
        success: false,
        message: verifyError.message || "Invalid or expired token.",
      });
    }

    // 5. Find user in DB
    const user = await User.findById(payload.data.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}.`,
      });
    }

    // 6. Attach to request
    req.user = user;
    req.sessionId = sessionId;
    return next();
  } catch (error) {
    console.error("[-] Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
}

module.exports = authenticateSWT;
