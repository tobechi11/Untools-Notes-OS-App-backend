import { sign, verify } from "hono/jwt";
import type { Context, Next } from "hono";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export type JWTPayload = {
  sub: string;
  email: string;
  exp: number;
};

export async function createToken(userId: string, email: string): Promise<string> {
  const payload: JWTPayload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  return sign(payload, JWT_SECRET);
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = (await verify(token, JWT_SECRET, "HS256")) as JWTPayload;
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
