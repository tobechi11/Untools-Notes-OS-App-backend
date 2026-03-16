import { prisma } from "../lib/prisma.ts";
import { extractNodes, deriveMetadata } from "./node-extractor.ts";
import { randomUUID } from "crypto";

const TAGS = ["growth", "geo", "fx", "hiring", "product", "strategy", "ops", "risk-mgmt"];

function sn(nodeType: string) {
  return { id: randomUUID(), nodeType, label: "" };
}

const SAMPLE_MEMOS = [
  {
    title: "Kenya Expansion Decision",
    tags: ["geo", "growth", "fx", "hiring"],
    tiptapJson: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Should we expand operations to Kenya in Q4 2026? Key considerations below." },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Decision") },
                  { type: "text", text: " Expand to Kenya with a phased Nairobi-first rollout in Q4 2026 #geo #growth" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Option") },
                  { type: "text", text: " Pilot in Nairobi only before wider rollout" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Assumption") },
                  { type: "text", text: " Customer acquisition cost stays below $40 in East Africa" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Risk") },
                  { type: "text", text: " FX volatility could compress margins by 5-8% #fx" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Assumption") },
                  { type: "text", text: " Local engineering team can be hired within 6 weeks #hiring" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Metric") },
                  { type: "text", text: " Target activation rate above 30% in first 90 days" },
                ],
              }],
            },
          ],
        },
        { type: "paragraph" },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("Confidence") },
            { type: "text", text: " High" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("ReviewDate") },
            { type: "text", text: " 2026-04-01" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("Outcome") },
            { type: "text", text: " pending" },
          ],
        },
      ],
    },
  },
  {
    title: "Product Roadmap Q3 Prioritization",
    tags: ["product", "strategy"],
    tiptapJson: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Deciding between feature A (AI summaries) and feature B (real-time collaboration) for Q3." },
          ],
        },
        { type: "paragraph" },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Decision") },
                  { type: "text", text: " Prioritize AI summaries over real-time collab for Q3 #product" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("TradeOff") },
                  { type: "text", text: " Collab has higher enterprise revenue potential but doubles dev time #strategy" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Upside") },
                  { type: "text", text: " AI summaries unlocks self-serve growth and reduces churn by ~15%" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Risk") },
                  { type: "text", text: " Competitors may ship collab first and lock in enterprise accounts" },
                ],
              }],
            },
          ],
        },
        { type: "paragraph" },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("Confidence") },
            { type: "text", text: " Medium" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("ReviewDate") },
            { type: "text", text: " 2026-05-15" },
          ],
        },
      ],
    },
  },
  {
    title: "Hiring Strategy — Engineering Leads",
    tags: ["hiring", "ops", "growth"],
    tiptapJson: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "We need two senior engineering leads by end of Q2. Evaluating agency vs. direct hire." },
          ],
        },
        { type: "paragraph" },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Decision") },
                  { type: "text", text: " Go direct-hire for both roles, skip agencies #hiring" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Assumption") },
                  { type: "text", text: " Inbound pipeline from blog posts will generate 20+ qualified leads" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Risk") },
                  { type: "text", text: " Timeline slip if pipeline underperforms — fallback to agency in week 4 #ops" },
                ],
              }],
            },
            {
              type: "listItem",
              content: [{
                type: "paragraph",
                content: [
                  { type: "structuredNode", attrs: sn("Constraint") },
                  { type: "text", text: " Total comp budget capped at $380k for both roles combined" },
                ],
              }],
            },
          ],
        },
        { type: "paragraph" },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("Confidence") },
            { type: "text", text: " Low" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("ReviewDate") },
            { type: "text", text: " 2026-03-20" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "structuredNode", attrs: sn("Outcome") },
            { type: "text", text: " pending" },
          ],
        },
      ],
    },
  },
];

export async function seedUserData(userId: string): Promise<{ memos: number; tags: number; nodes: number }> {
  const tagRecords = await Promise.all(
    TAGS.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
      }),
    ),
  );

  const tagMap = Object.fromEntries(tagRecords.map((t) => [t.name, t.id]));
  let totalNodes = 0;

  for (const sample of SAMPLE_MEMOS) {
    const tiptapJson = JSON.parse(JSON.stringify(sample.tiptapJson));

    // Replace all structuredNode IDs with fresh UUIDs so the seed can
    // be called multiple times without duplicate-key errors.
    (function refreshIds(node: any) {
      if (node?.type === "structuredNode" && node.attrs?.id) {
        node.attrs.id = randomUUID();
      }
      if (Array.isArray(node?.content)) {
        node.content.forEach(refreshIds);
      }
    })(tiptapJson);

    const memo = await prisma.memo.create({
      data: {
        userId,
        title: sample.title,
        tiptapJson,
      },
    });

    const memoTagIds = sample.tags
      .map((name) => tagMap[name])
      .filter(Boolean);

    if (memoTagIds.length > 0) {
      await prisma.memoTag.createMany({
        data: memoTagIds.map((tagId) => ({ memoId: memo.id, tagId })),
      });
    }

    const extracted = extractNodes(tiptapJson);
    totalNodes += extracted.length;

    for (const node of extracted) {
      await prisma.node.create({
        data: {
          id: node.id,
          memoId: memo.id,
          nodeType: node.nodeType,
          content: node.content,
          position: node.position,
          tags: node.tags,
        },
      });
    }

    const metadata = deriveMetadata(extracted);
    await prisma.memo.update({
      where: { id: memo.id },
      data: {
        confidence: metadata.confidence,
        reviewDate: metadata.reviewDate,
        outcome: metadata.outcome,
      },
    });
  }

  return { memos: SAMPLE_MEMOS.length, tags: TAGS.length, nodes: totalNodes };
}

export async function seedAllUsers(): Promise<{ users: number; memos: number; tags: number; nodes: number }> {
  const users = await prisma.user.findMany({ select: { id: true } });

  let totalMemos = 0;
  let totalTags = 0;
  let totalNodes = 0;

  for (const user of users) {
    const result = await seedUserData(user.id);
    totalMemos += result.memos;
    totalTags += result.tags;
    totalNodes += result.nodes;
  }

  return { users: users.length, memos: totalMemos, tags: totalTags, nodes: totalNodes };
}
