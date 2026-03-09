import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SEED_EMAIL = "demo@example.com";
const SEED_PASSWORD = "demo1234";

async function main() {
  console.log("Seeding database...");

  const passwordHash = await Bun.password.hash(SEED_PASSWORD, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    create: { email: SEED_EMAIL, passwordHash, name: "Demo User" },
    update: {},
  });

  const USER_ID = user.id;
  console.log(`Seed user: ${SEED_EMAIL} / ${SEED_PASSWORD}`);

  const tags = await Promise.all(
    ["growth", "geo", "fx", "hiring", "product", "strategy"].map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId: USER_ID, name } },
        create: { userId: USER_ID, name },
        update: {},
      }),
    ),
  );

  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t.id]));

  const memo1 = await prisma.memo.upsert({
    where: { id: "seed-memo-1" },
    create: {
      id: "seed-memo-1",
      userId: USER_ID,
      title: "Kenya Expansion Decision",
      confidence: "High",
      reviewDate: new Date("2026-03-01"),
      outcome: "pending",
      tiptapJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Should we expand operations to Kenya in Q3?" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-1", nodeType: "Decision" },
            content: [{ type: "text", text: "Expand to Kenya in Q3 #geo #growth" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-2", nodeType: "Risk" },
            content: [{ type: "text", text: "FX volatility could impact margins by 5-8% #fx" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-3", nodeType: "Assumption" },
            content: [{ type: "text", text: "Local team can be hired within 6 weeks #hiring" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-4", nodeType: "Confidence" },
            content: [{ type: "text", text: "High" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-5", nodeType: "ReviewDate" },
            content: [{ type: "text", text: "2026-03-01" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-6", nodeType: "Outcome" },
            content: [{ type: "text", text: "Pending" }],
          },
        ],
      },
    },
    update: {},
  });

  await prisma.memoTag.deleteMany({ where: { memoId: memo1.id } });
  await prisma.memoTag.createMany({
    data: ["geo", "growth", "fx", "hiring"].map((name) => ({
      memoId: memo1.id,
      tagId: tagMap[name]!,
    })),
  });

  await prisma.node.deleteMany({ where: { memoId: memo1.id } });
  await prisma.node.createMany({
    data: [
      { id: "seed-node-1", memoId: memo1.id, nodeType: "Decision", content: "Expand to Kenya in Q3 #geo #growth", position: 0, tags: ["geo", "growth"] },
      { id: "seed-node-2", memoId: memo1.id, nodeType: "Risk", content: "FX volatility could impact margins by 5-8% #fx", position: 1, tags: ["fx"] },
      { id: "seed-node-3", memoId: memo1.id, nodeType: "Assumption", content: "Local team can be hired within 6 weeks #hiring", position: 2, tags: ["hiring"] },
      { id: "seed-node-4", memoId: memo1.id, nodeType: "Confidence", content: "High", position: 3, tags: [] },
      { id: "seed-node-5", memoId: memo1.id, nodeType: "ReviewDate", content: "2026-03-01", position: 4, tags: [] },
      { id: "seed-node-6", memoId: memo1.id, nodeType: "Outcome", content: "Pending", position: 5, tags: [] },
    ],
  });

  const memo2 = await prisma.memo.upsert({
    where: { id: "seed-memo-2" },
    create: {
      id: "seed-memo-2",
      userId: USER_ID,
      title: "Product Roadmap Q3 Prioritization",
      confidence: "Medium",
      reviewDate: new Date("2026-04-15"),
      outcome: null,
      tiptapJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Deciding between feature A and feature B for Q3." }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-7", nodeType: "Decision" },
            content: [{ type: "text", text: "Prioritize feature A over feature B #product" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-8", nodeType: "TradeOff" },
            content: [{ type: "text", text: "Feature B has higher revenue potential but longer dev time #strategy" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-9", nodeType: "Confidence" },
            content: [{ type: "text", text: "Medium" }],
          },
          {
            type: "structuredNode",
            attrs: { id: "seed-node-10", nodeType: "ReviewDate" },
            content: [{ type: "text", text: "2026-04-15" }],
          },
        ],
      },
    },
    update: {},
  });

  await prisma.memoTag.deleteMany({ where: { memoId: memo2.id } });
  await prisma.memoTag.createMany({
    data: ["product", "strategy"].map((name) => ({
      memoId: memo2.id,
      tagId: tagMap[name]!,
    })),
  });

  await prisma.node.deleteMany({ where: { memoId: memo2.id } });
  await prisma.node.createMany({
    data: [
      { id: "seed-node-7", memoId: memo2.id, nodeType: "Decision", content: "Prioritize feature A over feature B #product", position: 0, tags: ["product"] },
      { id: "seed-node-8", memoId: memo2.id, nodeType: "TradeOff", content: "Feature B has higher revenue potential but longer dev time #strategy", position: 1, tags: ["strategy"] },
      { id: "seed-node-9", memoId: memo2.id, nodeType: "Confidence", content: "Medium", position: 2, tags: [] },
      { id: "seed-node-10", memoId: memo2.id, nodeType: "ReviewDate", content: "2026-04-15", position: 3, tags: [] },
    ],
  });

  console.log("Seeded 1 user, 2 memos, 6 tags, 10 nodes.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
