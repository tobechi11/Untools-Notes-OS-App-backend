import { Hono } from "hono";
import { prisma } from "../lib/prisma.ts";

export const tagRoutes = new Hono();

tagRoutes.get("/", async (c) => {
  const userId = c.get("userId") as string;
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return c.json(tags.map((t) => ({ name: t.name })));
});

tagRoutes.delete("/:name", async (c) => {
  const userId = c.get("userId") as string;
  const name = decodeURIComponent(c.req.param("name")).trim().toLowerCase();

  const tag = await prisma.tag.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (!tag) {
    return c.json({ error: "Tag not found" }, 404);
  }

  await prisma.tag.delete({ where: { id: tag.id } });
  return c.json({ ok: true });
});
