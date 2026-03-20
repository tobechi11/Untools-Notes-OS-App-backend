import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiReference } from "@scalar/hono-api-reference";
import { authRoutes } from "./routes/auth.ts";
import { memoRoutes } from "./routes/memos.ts";
import { dashboardRoutes } from "./routes/dashboard.ts";
import { tagRoutes } from "./routes/tags.ts";
import { transcribeRoutes } from "./routes/transcribe.ts";
import { aiChatRoutes } from "./routes/ai-chat.ts";
import { realtimeSessionRoutes } from "./routes/realtime-session.ts";
import { linkableNodesRoutes } from "./routes/linkable-nodes.ts";
import { authMiddleware } from "./lib/auth.ts";
import { openApiSpec } from "./lib/openapi.ts";
import { sendTestEmail } from "./services/email.ts";
import { seedAllUsers, seedUserData } from "./services/seed-data.ts";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/*", logger());

const api = new Hono();

api.route("/auth", authRoutes);

api.get("/health", (c) => c.json({ status: "ok" }));
api.get("/openapi.json", (c) => c.json(openApiSpec));

api.post("/test-email", async (c) => {
  const body = (await c.req.json()) as { to?: string };
  if (!body.to) return c.json({ error: '"to" email is required' }, 400);

  const to = body.to.trim().toLowerCase();

  try {
    const result = await sendTestEmail(to);
    const parsed = (() => {
      try {
        return JSON.parse(result.body);
      } catch {
        return result.body;
      }
    })();
    return c.json({
      success: result.status >= 200 && result.status < 300,
      sentTo: to,
      brevoStatus: result.status,
      brevoResponse: parsed,
      config: {
        senderEmail: process.env.BREVO_SENDER_EMAIL ?? "(not set)",
        senderName: process.env.BREVO_SENDER_NAME ?? "(not set)",
        apiKeySet: !!process.env.BREVO_API_KEY,
        apiKeyPrefix: process.env.BREVO_API_KEY?.slice(0, 12) + "...",
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.post("/seed", async (c) => {
  try {
    const result = await seedAllUsers();
    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

api.use("/*", authMiddleware);
api.route("/memos", memoRoutes);
api.route("/dashboard", dashboardRoutes);
api.route("/tags", tagRoutes);
api.route("/transcribe", transcribeRoutes);
api.route("/ai/chat", aiChatRoutes);
api.route("/realtime", realtimeSessionRoutes);
api.route("/linkable-nodes", linkableNodesRoutes);

app.route("/api", api);

app.get(
  "/docs",
  apiReference({
    spec: { url: "/api/openapi.json" },
    pageTitle: "Untools Notes — API Docs",
    theme: "default",
  })
);

const port = Number(process.env.PORT ?? 3001);

console.log(`API server listening on http://localhost:${port}/api`);
console.log(`API docs available at http://localhost:${port}/docs`);

export default {
  port,
  fetch: app.fetch,
};
