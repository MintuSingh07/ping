const User = require("../../models/user.model");
const { sign, getStore } = require("secure-web-token");

const SWT_SECRET = process.env.SWT_SECRET;
const store = getStore("memory");

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
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
      },
    });
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
    const { email, password } = req.body;

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

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}.`,
      });
    }

    // Sign SWT — encrypted token + device-bound session (per docs)
    const { token, sessionId } = sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      SWT_SECRET,
      {
        fingerprint: true,
        store: "memory",
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
      store.deleteSession(sessionId); // token is dead immediately
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

module.exports = {
  registerPing,
  loginPing,
  logoutPing,
};
