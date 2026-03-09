import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";
import { createToken, authMiddleware } from "../lib/auth.ts";
import {
  generateOtp,
  otpExpiresAt,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.ts";

export const authRoutes = new Hono();

async function createAndSendOtp(
  userId: string,
  email: string,
  type: "email_verification" | "password_reset",
) {
  await prisma.otpCode.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateOtp();
  await prisma.otpCode.create({
    data: { userId, code, type, expiresAt: otpExpiresAt() },
  });

  if (type === "email_verification") {
    await sendVerificationEmail(email, code);
  } else {
    await sendPasswordResetEmail(email, code);
  }

  return code;
}

// ─── Register ────────────────────────────────────────────────

authRoutes.post("/register", async (c) => {
  const body = (await c.req.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "Invalid email format" }, 400);
  }

  if (body.password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await Bun.password.hash(body.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: body.name?.trim() || null,
      emailVerified: false,
    },
  });

  await createAndSendOtp(user.id, email, "email_verification");

  return c.json(
    { message: "Verification code sent to your email", email },
    201,
  );
});

// ─── Verify Email ────────────────────────────────────────────

authRoutes.post("/verify-email", async (c) => {
  const body = (await c.req.json()) as { email?: string; code?: string };

  if (!body.email || !body.code) {
    return c.json({ error: "Email and code are required" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ error: "Invalid email or code" }, 400);
  }

  if (user.emailVerified) {
    const token = await createToken(user.id, user.email);
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      type: "email_verification",
      code: body.code.trim(),
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return c.json({ error: "Invalid or expired verification code" }, 400);
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
  ]);

  const token = await createToken(user.id, user.email);

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// ─── Resend Verification ─────────────────────────────────────

authRoutes.post("/resend-verification", async (c) => {
  const body = (await c.req.json()) as { email?: string };

  if (!body.email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return c.json({ message: "If the email exists, a verification code was sent" });
  }

  if (user.emailVerified) {
    return c.json({ message: "Email is already verified" });
  }

  await createAndSendOtp(user.id, email, "email_verification");

  return c.json({ message: "Verification code resent" });
});

// ─── Login ───────────────────────────────────────────────────

authRoutes.post("/login", async (c) => {
  const body = (await c.req.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const email = body.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await Bun.password.verify(body.password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  if (!user.emailVerified) {
    return c.json(
      { error: "Email not verified", needsVerification: true, email },
      403,
    );
  }

  const token = await createToken(user.id, user.email);

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// ─── Forgot Password ─────────────────────────────────────────

authRoutes.post("/forgot-password", async (c) => {
  const body = (await c.req.json()) as { email?: string };

  if (!body.email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await createAndSendOtp(user.id, email, "password_reset");
  }

  return c.json({ message: "If the email exists, a reset code was sent" });
});

// ─── Reset Password ──────────────────────────────────────────

authRoutes.post("/reset-password", async (c) => {
  const body = (await c.req.json()) as {
    email?: string;
    code?: string;
    newPassword?: string;
  };

  if (!body.email || !body.code || !body.newPassword) {
    return c.json({ error: "Email, code, and new password are required" }, 400);
  }

  if (body.newPassword.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ error: "Invalid email or code" }, 400);
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      type: "password_reset",
      code: body.code.trim(),
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return c.json({ error: "Invalid or expired reset code" }, 400);
  }

  const passwordHash = await Bun.password.hash(body.newPassword, {
    algorithm: "bcrypt",
    cost: 10,
  });

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
  ]);

  return c.json({ message: "Password reset successful" });
});

// ─── Me ──────────────────────────────────────────────────────

authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// ─── List All Users (API docs only) ───────────────────────────

authRoutes.get("/users", authMiddleware, async (c) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { memos: true, tags: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      memoCount: u._count.memos,
      tagCount: u._count.tags,
    })),
  );
});

// ─── Delete User by ID (API docs only) ────────────────────────

authRoutes.delete("/user/:id", authMiddleware, async (c) => {
  const targetId = c.req.param("id");

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await prisma.user.delete({ where: { id: targetId } });

  return c.json({ message: "User deleted", id: targetId });
});
