import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";
import { extractNodes, deriveMetadata } from "../services/node-extractor.ts";

export const memoRoutes = new Hono();

function getUserId(c: { get: (key: string) => unknown }): string {
  return c.get("userId") as string;
}

function isReviewDue(
  reviewDate: Date | null,
  outcome: string | null,
): boolean {
  if (!reviewDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (reviewDate > today) return false;
  return !outcome || outcome.toLowerCase() === "pending";
}

memoRoutes.post("/", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const memo = await prisma.memo.create({
    data: {
      userId,
      title: (body as Record<string, unknown>).title as string | undefined ?? "Untitled memo",
    },
  });
  return c.json({ id: memo.id }, 201);
});

memoRoutes.get("/", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  const tagsParam = c.req.query("tags");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const offset = Number(c.req.query("offset")) || 0;
  const tagFilters = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const userId = getUserId(c);
  const where: Record<string, unknown> = { userId };

  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }

  if (tagFilters.length > 0) {
    where.memoTags = {
      some: {
        tag: { name: { in: tagFilters } },
      },
    };
  }

  const memos = await prisma.memo.findMany({
    where,
    include: {
      memoTags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip: offset,
  });

  const rows = memos.map((m) => ({
    id: m.id,
    title: m.title,
    tags: m.memoTags.map((mt) => mt.tag.name),
    confidence: m.confidence,
    reviewDate: m.reviewDate?.toISOString().split("T")[0] ?? null,
    outcome: m.outcome,
    status: m.status ?? null,
    updatedAt: m.updatedAt.toISOString(),
    reviewDue: isReviewDue(m.reviewDate, m.outcome),
  }));

  return c.json(rows);
});

memoRoutes.get("/:id", async (c) => {
  const userId = getUserId(c);
  const id = c.req.param("id");
  const memo = await prisma.memo.findFirst({
    where: { id, userId },
    include: { memoTags: { include: { tag: true } } },
  });

  if (!memo) {
    return c.json({ error: "Memo not found" }, 404);
  }

  return c.json({
    id: memo.id,
    title: memo.title,
    tiptapJson: memo.tiptapJson ?? { type: "doc", content: [{ type: "paragraph" }] },
    tags: memo.memoTags.map((mt) => mt.tag.name),
    confidence: memo.confidence,
    reviewDate: memo.reviewDate?.toISOString().split("T")[0] ?? null,
    outcome: memo.outcome,
    createdAt: memo.createdAt.toISOString(),
    updatedAt: memo.updatedAt.toISOString(),
  });
});

memoRoutes.put("/:id", async (c) => {
  const userId = getUserId(c);
  const id = c.req.param("id");
  const body = (await c.req.json()) as {
    title?: string;
    tiptapJson?: Record<string, unknown>;
    tags?: string[];
  };

  const existing = await prisma.memo.findFirst({ where: { id, userId } });
  if (!existing) {
    return c.json({ error: "Memo not found" }, 404);
  }

  const rawTags = (body.tags ?? [])
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
  const uniqueTags = [...new Set(rawTags)];

  const tagRecords = await Promise.all(
    uniqueTags.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
      }),
    ),
  );

  await prisma.memoTag.deleteMany({ where: { memoId: id } });
  if (tagRecords.length > 0) {
    await prisma.memoTag.createMany({
      data: tagRecords.map((tag) => ({ memoId: id, tagId: tag.id })),
    });
  }

  const extractedNodes = body.tiptapJson
    ? extractNodes(body.tiptapJson as Parameters<typeof extractNodes>[0])
    : [];

  const incomingNodeIds = new Set(extractedNodes.map((n) => n.id));

  await prisma.node.deleteMany({
    where: {
      memoId: id,
      id: { notIn: [...incomingNodeIds] },
    },
  });

  for (const node of extractedNodes) {
    await prisma.node.upsert({
      where: { id: node.id },
      create: {
        id: node.id,
        memoId: id,
        nodeType: node.nodeType,
        content: node.content,
        position: node.position,
        tags: node.tags,
      },
      update: {
        nodeType: node.nodeType,
        content: node.content,
        position: node.position,
        tags: node.tags,
      },
    });
  }

  const metadata = deriveMetadata(extractedNodes);

  await prisma.memo.update({
    where: { id },
    data: {
      title: body.title || "Untitled memo",
      tiptapJson: body.tiptapJson ?? undefined,
      confidence: metadata.confidence,
      reviewDate: metadata.reviewDate,
      outcome: metadata.outcome,
      status: metadata.status,
    },
  });

  return c.json({ ok: true });
});

memoRoutes.delete("/:id", async (c) => {
  const userId = getUserId(c);
  const id = c.req.param("id");
  const existing = await prisma.memo.findFirst({ where: { id, userId } });
  if (!existing) {
    return c.json({ error: "Memo not found" }, 404);
  }

  await prisma.memo.delete({ where: { id } });
  return c.json({ ok: true });
});
