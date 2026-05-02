const { getTransporter } = require("../config/email");

const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${process.env.BRAND_NAME || "FlowBridge"}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2>Hi ${name},</h2>
        <p>You requested a password reset. Click below:</p>
        <a href="${resetUrl}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#666">
          This link expires in <strong>15 minutes</strong>.<br/>
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
