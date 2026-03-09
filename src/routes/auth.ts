import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";
import { createToken, authMiddleware } from "../lib/auth.ts";

export const authRoutes = new Hono();

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
    },
  });

  const token = await createToken(user.id, user.email);

  return c.json(
    {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    },
    201,
  );
});

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

  const token = await createToken(user.id, user.email);

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});
