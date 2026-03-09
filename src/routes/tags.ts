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
