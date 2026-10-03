const nodemailer = require("nodemailer");
let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (parseInt(process.env.SMTP_PORT) || 587) === 465,
    requireTLS: true, // refuse to send credentials over plaintext (STARTTLS mandatory)
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const verifyEmailConfig = async () => {
  try {
    await createTransporter().verify();
    console.log("✅ Email (SMTP) configured");
    return true;
  } catch (e) {
    console.warn("⚠️  Email disabled:", e.message);
    return false;
  }
};

module.exports = { createTransporter, verifyEmailConfig, getTransporter: createTransporter };
