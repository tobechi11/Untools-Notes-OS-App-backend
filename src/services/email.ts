import nodemailer from "nodemailer";

const SMTP_HOST = (process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com").trim();
const SMTP_PORT = parseInt(process.env.BREVO_SMTP_PORT ?? "587", 10);
const SMTP_USER = (process.env.BREVO_SMTP_USER ?? "").trim();
const SMTP_PASS = (process.env.BREVO_SMTP_PASS ?? "").trim();
const SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com").trim();
const SENDER_NAME = (process.env.BREVO_SENDER_NAME ?? "AI Note Taker").trim();

export const OTP_EXPIRY_MINUTES = 15;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn(`[EMAIL] No BREVO_SMTP_USER/PASS set. Would send to ${to}: ${subject}`);
    return;
  }

  console.log(`[EMAIL] Sending to ${to} | subject: "${subject}" | sender: ${SENDER_EMAIL}`);

  const info = await transporter.sendMail({
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to,
    subject,
    html: htmlContent,
  });

  console.log(`[EMAIL] Sent OK | messageId: ${info.messageId}`);
}

export async function sendTestEmail(to: string): Promise<{ status: number; body: string }> {
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Email service is working!</h2>
        <p>If you received this, your Brevo SMTP configuration is correct.</p>
        <p style="color: #666; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
      </div>
    `;
    await sendEmail(to, "Test email from AI Note Taker", html);
    return { status: 200, body: "OK" };
  } catch (err: any) {
    return { status: 500, body: err.message ?? String(err) };
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Verify your email</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px 0; color: #111;">
        ${code}
      </div>
      <p style="color: #666;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p style="color: #999; font-size: 12px;">If you didn't create an account, ignore this email.</p>
    </div>
  `;
  await sendEmail(to, "Verify your email", html);
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Reset your password</h2>
      <p>Your password reset code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px 0; color: #111;">
        ${code}
      </div>
      <p style="color: #666;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request a password reset, ignore this email.</p>
    </div>
  `;
  await sendEmail(to, "Reset your password", html);
}
