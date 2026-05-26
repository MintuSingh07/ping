const crypto = require("crypto");

const SWT_SECRET = process.env.SWT_SECRET;

// Derive a 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(SWT_SECRET).digest();
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt a text
 * @param {string} text 
 * @returns {string} iv:encryptedText
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a text
 * @param {string} encryptedText iv:encryptedText
 * @returns {string} original text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  try {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedTextBuffer = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedTextBuffer, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
