import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";

export const dashboardRoutes = new Hono();

dashboardRoutes.get("/nodes", async (c) => {
  const userId = c.get("userId") as string;
  const nodeTypesParam = c.req.query("node_types");
  const tagsParam = c.req.query("tags");
  const confidence = c.req.query("confidence");
  const outcome = c.req.query("outcome");
  const q = c.req.query("q")?.trim().toLowerCase() || "";
  const dateFrom = c.req.query("date_from");
  const dateTo = c.req.query("date_to");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 200);
  const offset = Number(c.req.query("offset")) || 0;

  const nodeTypeFilters = nodeTypesParam
    ? nodeTypesParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const tagFilters = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const memoFilter: Record<string, unknown> = { userId };

  if (tagFilters.length > 0) {
    memoFilter.memoTags = {
      some: {
        tag: { name: { in: tagFilters } },
      },
    };
  }

  if (confidence) {
    memoFilter.confidence = confidence;
  }

  if (outcome) {
    memoFilter.outcome = outcome;
  }

  const where: Record<string, unknown> = { memo: memoFilter };

  if (nodeTypeFilters.length > 0) {
    where.nodeType = { in: nodeTypeFilters };
  }

  if (q) {
    where.content = { contains: q, mode: "insensitive" };
  }

  const createdAtFilter: Record<string, Date> = {};
  if (dateFrom) {
    createdAtFilter.gte = new Date(dateFrom);
  }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    createdAtFilter.lte = end;
  }
  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  const nodes = await prisma.node.findMany({
    where,
    include: {
      memo: {
        include: {
          memoTags: { include: { tag: true } },
        },
      },
    },
    orderBy: [{ memo: { updatedAt: "desc" } }, { position: "asc" }],
    take: limit,
    skip: offset,
  });

  const rows = nodes.map((n) => ({
    nodeId: n.id,
    nodeType: n.nodeType,
    content: n.content,
    position: n.position,
    createdAt: n.createdAt.toISOString(),
    memoId: n.memo.id,
    memoTitle: n.memo.title,
    memoTags: n.memo.memoTags.map((mt) => mt.tag.name),
    confidence: n.memo.confidence,
    reviewDate: n.memo.reviewDate?.toISOString().split("T")[0] ?? null,
    outcome: n.memo.outcome,
  }));

  return c.json(rows);
});

dashboardRoutes.get("/due", async (c) => {
  const userId = c.get("userId") as string;
  const withinDays = Number(c.req.query("within_days")) || 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + withinDays);

  const memos = await prisma.memo.findMany({
    where: {
      userId,
      reviewDate: { lte: maxDate },
      OR: [{ outcome: null }, { outcome: "pending" }],
    },
    include: {
      memoTags: { include: { tag: true } },
    },
    orderBy: { reviewDate: "asc" },
  });

  const rows = memos.map((m) => ({
    id: m.id,
    title: m.title,
    tags: m.memoTags.map((mt) => mt.tag.name),
    confidence: m.confidence,
    reviewDate: m.reviewDate?.toISOString().split("T")[0] ?? null,
    outcome: m.outcome,
    updatedAt: m.updatedAt.toISOString(),
    reviewDue: true,
  }));

  return c.json(rows);
});
