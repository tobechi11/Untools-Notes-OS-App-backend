const BREVO_API_KEY = (process.env.BREVO_API_KEY ?? "").trim();
const SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com").trim();
const SENDER_NAME = (process.env.BREVO_SENDER_NAME ?? "AI Note Taker").trim();

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export const OTP_EXPIRY_MINUTES = 15;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  if (!BREVO_API_KEY) {
    console.warn(`[EMAIL] No BREVO_API_KEY set. Would send to ${to}: ${subject}`);
    return;
  }

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  console.log(`[EMAIL] Sending to ${to} | subject: "${subject}" | sender: ${SENDER_EMAIL}`);

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();

  if (!res.ok) {
    console.error(`[EMAIL] Brevo API error (${res.status}): ${body}`);
    throw new Error(`Email send failed: ${res.status} — ${body}`);
  }

  console.log(`[EMAIL] Sent OK (${res.status}): ${body}`);
}

export async function sendTestEmail(to: string): Promise<{ status: number; body: string }> {
  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: to }],
    subject: "Test email from AI Note Taker",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Email service is working!</h2>
        <p>If you received this, your Brevo configuration is correct.</p>
        <p style="color: #666; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
      </div>
    `,
  };

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  return { status: res.status, body };
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
