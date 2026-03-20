import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";

export const linkableNodesRoutes = new Hono();

const LINKABLE_TYPES = ["Problem", "Decision"];

linkableNodesRoutes.get("/", async (c) => {
  const userId = c.get("userId") as string;

  const nodes = await prisma.node.findMany({
    where: {
      nodeType: { in: LINKABLE_TYPES },
      memo: { userId },
    },
    select: {
      id: true,
      nodeType: true,
      content: true,
      memoId: true,
      memo: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return c.json({
    nodes: nodes.map((n) => ({
      id: n.id,
      nodeType: n.nodeType,
      content: n.content,
      memoId: n.memoId,
      memoTitle: n.memo.title,
    })),
  });
});
