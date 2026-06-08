const User = require("../../models/user.model");
const { sign } = require("secure-web-token");
const { redisStore, redisClient } = require("../../utils/redis.util");
const { sendOtpEmail } = require("../../utils/email.util");
const crypto = require("crypto");

const SWT_SECRET = process.env.SWT_SECRET;

/**
 * Register a new user
 */
async function registerPing(req, res) {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      status: "pending",
    });

    await newUser.save();

    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpKey = `otp:register:${email.toLowerCase()}`;
    
    // Store OTP in Redis with 5-minute TTL (300 seconds)
    await redisClient.set(otpKey, otp, "EX", 300);

    // Send OTP email
    const emailResult = await sendOtpEmail(email.toLowerCase(), otp);

    const responseData = {
      success: true,
      message: "User registered successfully. A verification OTP has been sent to your email.",
      email: email.toLowerCase(),
    };

    if (emailResult.simulated) {
      responseData.otp = otp;
    }

    return res.status(201).json(responseData);
  } catch (error) {
    console.error("[-] Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
}

/**
 * Login — issues encrypted SWT token + HttpOnly session cookie
 * Following SWT docs: fingerprint: true, store: "memory"
 */
async function loginPing(req, res) {
  try {
    const { email, password, clientPublicKey } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required.",
      });
    }

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    if (user.status === "pending") {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpKey = `otp:register:${user.email}`;
      
      await redisClient.set(otpKey, otp, "EX", 300);
      const emailResult = await sendOtpEmail(user.email, otp);

      const responseData = {
        success: false,
        pendingVerification: true,
        message: "Your account is pending email verification. A new OTP has been sent.",
        email: user.email,
      };

      if (emailResult.simulated) {
        responseData.otp = otp;
      }

      return res.status(403).json(responseData);
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}.`,
      });
    }

    const pubKeyStr = clientPublicKey 
      ? (typeof clientPublicKey === "string" ? clientPublicKey : JSON.stringify(clientPublicKey))
      : undefined;

    // Sign SWT — encrypted token + session state registration
    const { token, sessionId } = await sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      SWT_SECRET,
      {
        fingerprint: !!pubKeyStr, // DPoP binding if key provided
        store: redisStore,
        clientPublicKey: pubKeyStr,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      }
    );

    // sessionId → HttpOnly cookie (invisible to JS / XSS-proof)
    res.cookie("swt_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Encrypted token → client stores in localStorage
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[-] Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login.",
    });
  }
}

/**
 * Logout — true server-side session revocation (per docs)
 * Token becomes dead immediately after this call.
 */
async function logoutPing(req, res) {
  try {
    const sessionId = req.cookies.swt_session;

    if (sessionId) {
      await redisStore.revokeSession(sessionId); // token is dead immediately
    }

    res.clearCookie("swt_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("[-] Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout.",
    });
  }
}

/**
 * Verify OTP and activate the user account
 */
async function verifyOtpPing(req, res) {
  try {
    const { email, otp, clientPublicKey } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP code are required.",
      });
    }

    const lowerEmail = email.toLowerCase();
    const otpKey = `otp:register:${lowerEmail}`;

    // 1. Get OTP from Redis
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid.",
      });
    }

    // 2. Validate OTP
    if (storedOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code.",
      });
    }

    // 3. Find user and activate
    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status = "active";
    await user.save();

    // 4. Delete OTP from Redis
    await redisClient.del(otpKey);

    // 5. Generate SWT Session Token (log them in immediately)
    const pubKeyStr = clientPublicKey 
      ? (typeof clientPublicKey === "string" ? clientPublicKey : JSON.stringify(clientPublicKey))
      : undefined;

    const { token, sessionId } = await sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      SWT_SECRET,
      {
        fingerprint: !!pubKeyStr, // DPoP binding if key provided
        store: redisStore,
        clientPublicKey: pubKeyStr,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      }
    );

    // Set HttpOnly cookie
    res.cookie("swt_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Account is now active.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[-] OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during verification.",
    });
  }
}

/**
 * Resend OTP to a pending user
 */
async function resendOtpPing(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Account is not in pending state (status: ${user.status}).`,
      });
    }

    // Generate secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpKey = `otp:register:${lowerEmail}`;

    await redisClient.set(otpKey, otp, "EX", 300);
    const emailResult = await sendOtpEmail(lowerEmail, otp);

    const responseData = {
      success: true,
      message: "A new verification OTP has been sent to your email.",
      email: lowerEmail,
    };

    if (emailResult.simulated) {
      responseData.otp = otp;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("[-] OTP resend error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP resend.",
    });
  }
}

module.exports = {
  registerPing,
  loginPing,
  logoutPing,
  verifyOtpPing,
  resendOtpPing,
};
