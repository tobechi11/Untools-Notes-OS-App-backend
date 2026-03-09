import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiReference } from "@scalar/hono-api-reference";
import { authRoutes } from "./routes/auth.ts";
import { memoRoutes } from "./routes/memos.ts";
import { dashboardRoutes } from "./routes/dashboard.ts";
import { tagRoutes } from "./routes/tags.ts";
import { authMiddleware } from "./lib/auth.ts";
import { openApiSpec } from "./lib/openapi.ts";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/*", logger());

const api = new Hono();

api.route("/auth", authRoutes);

api.get("/health", (c) => c.json({ status: "ok" }));
api.get("/openapi.json", (c) => c.json(openApiSpec));

api.use("/*", authMiddleware);
api.route("/memos", memoRoutes);
api.route("/dashboard", dashboardRoutes);
api.route("/tags", tagRoutes);

app.route("/api", api);

app.get(
  "/docs",
  apiReference({
    spec: { url: "/api/openapi.json" },
    pageTitle: "AI Note Taker — API Docs",
    theme: "default",
  }),
);

const port = Number(process.env.PORT ?? 3001);

console.log(`API server listening on http://localhost:${port}/api`);
console.log(`API docs available at http://localhost:${port}/docs`);

export default {
  port,
  fetch: app.fetch,
};
