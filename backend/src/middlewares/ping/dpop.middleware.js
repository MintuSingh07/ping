const { verify } = require("secure-web-token");
const User = require("../../models/user.model");
const { redisStore } = require("../../utils/redis.util");

const SWT_SECRET = process.env.SWT_SECRET;

/**
 * Require DPoP Middleware
 * Verifies that the session is cryptographically bound to a client public key (DPoP),
 * and validates the client signature headers.
 */
async function requireDPoP(req, res, next) {
  try {
    let sessionId = req.sessionId;

    // 1. Fallback: If authenticateSWT did not run before this middleware, run full authentication checks
    if (!sessionId) {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided.",
        });
      }
      const token = authHeader.split(" ")[1];

      // Get sessionId from HttpOnly cookie
      sessionId = req.cookies.swt_session;
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: "Access denied. Session cookie missing.",
        });
      }

      // Verify token and DPoP signature
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
 
      // Find user in DB
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
 
      // Attach to request
      req.user = user;
      req.sessionId = sessionId;
    }
 
    // 2. Inspect Redis session store to ensure DPoP (jkt) is bound
    const session = await redisStore.getSession(sessionId);
    if (!session || !session.jkt) {
      return res.status(401).json({
        success: false,
        message: "DPoP secure binding is required to access this service.",
      });
    }
 
    // Success: Proceed
    return next();
  } catch (error) {
    console.error("[-] requireDPoP middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during DPoP verification.",
    });
  }
}

module.exports = requireDPoP;
