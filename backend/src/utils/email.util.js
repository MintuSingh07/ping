const nodemailer = require("nodemailer");

/**
 * Send an OTP verification email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{simulated: boolean, otp?: string, messageId?: string}>}
 */
async function sendOtpEmail(toEmail, otp) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Ping App" <noreply@pingapp.com>';

  // Check if SMTP is configured
  if (!host || !user || !pass) {
    console.log("\n==================================================");
    console.log(`[!] SMTP NOT CONFIGURED. Simulated Email to: ${toEmail}`);
    console.log(`[!] Verification OTP Code: ${otp}`);
    console.log("==================================================\n");
    return { simulated: true, otp };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: toEmail,
      subject: "Verify your email address - Ping App",
      text: `Your verification code is: ${otp}. This code is valid for 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Welcome to Ping!</h2>
          <p>Please use the following One-Time Password (OTP) to verify your email address. This code is valid for <b>5 minutes</b>.</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; letter-spacing: 5px; margin: 20px 0; color: #4F46E5;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[+] Verification email sent to ${toEmail}: ${info.messageId}`);
    return { simulated: false, messageId: info.messageId };
  } catch (error) {
    console.error("[-] Error sending verification email:", error);
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
};
