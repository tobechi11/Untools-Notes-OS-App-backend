import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma.ts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ModelId = "auto" | "claude" | "gpt5";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const GRAMMAR_ACTIONS = ["fix grammar", "grammar", "simplify", "summarize"];

function pickProvider(model: ModelId, lastMessage: string): "openai" | "anthropic" {
  if (model === "claude") return "anthropic";
  if (model === "gpt5") return "openai";
  // Auto: grammar/summarize → OpenAI, everything else → Anthropic
  const lower = lastMessage.toLowerCase();
  if (GRAMMAR_ACTIONS.some((a) => lower.includes(a))) return "openai";
  return "anthropic";
}

function buildSystemPrompt(selectedText: string, fullMemoContent?: string): string {
  if (selectedText.trim()) {
    return `You are an AI writing assistant helping a user refine a decision memo. The user has selected the following text from their document:

---
${selectedText}
---

Help the user improve, refine, or transform this text based on their instructions. When providing revised text, write it clearly so the user can apply it directly to their document. Be concise and focused on the writing task.`;
  }

  if (fullMemoContent?.trim()) {
    return `You are an AI writing assistant helping a user with their decision memo. Here is the full memo content:

---
${fullMemoContent}
---

Help the user with any questions or improvements they need for this memo. When providing revised text, write it clearly. Be concise and focused on the writing task.`;
  }

  return `You are an AI writing assistant helping a user with their decision memo. Help them with writing, editing, brainstorming, or any other writing-related tasks. Be concise and focused.`;
}

export const aiChatRoutes = new Hono();

// Stream AI response
aiChatRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const messages: ChatMessage[] = body.messages ?? [];
  const model: ModelId = body.model ?? "auto";
  const selectedText: string = body.selectedText ?? "";
  const fullMemoContent: string = body.fullMemoContent ?? "";

  if (messages.length === 0) {
    return c.json({ error: "No messages provided" }, 400);
  }

  const lastUserMessage = messages.findLast((m) => m.role === "user")?.content ?? "";
  const provider = pickProvider(model, lastUserMessage);
  const systemPrompt = buildSystemPrompt(selectedText, fullMemoContent);

  return streamSSE(c, async (stream) => {
    try {
      if (provider === "openai") {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            await stream.writeSSE({ data: JSON.stringify({ text }) });
          }
        }
      } else {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            await stream.writeSSE({ data: JSON.stringify({ text: event.delta.text }) });
          }
        }
      }

      await stream.writeSSE({ data: "[DONE]" });
    } catch (err: any) {
      console.error("AI chat error:", err.message);
      await stream.writeSSE({
        data: JSON.stringify({ error: err.message }),
      });
    }
  });
});

// Get chat history for a memo
aiChatRoutes.get("/history/:memoId", async (c) => {
  const userId = c.get("userId") as string;
  const memoId = c.req.param("memoId");

  // Verify ownership
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, userId },
  });
  if (!memo) {
    return c.json({ error: "Memo not found" }, 404);
  }

  const messages = await prisma.aiChatMessage.findMany({
    where: { memoId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, model: true, createdAt: true },
  });

  return c.json({ messages });
});

// Save chat messages for a memo
aiChatRoutes.post("/save", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const { memoId, messages } = body as {
    memoId: string;
    messages: { role: string; content: string; model?: string }[];
  };

  if (!memoId || !messages?.length) {
    return c.json({ error: "memoId and messages are required" }, 400);
  }

  // Verify ownership
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, userId },
  });
  if (!memo) {
    return c.json({ error: "Memo not found" }, 404);
  }

  await prisma.aiChatMessage.createMany({
    data: messages.map((m) => ({
      memoId,
      role: m.role,
      content: m.content,
      model: m.model ?? null,
    })),
  });

  return c.json({ success: true });
});

// Clear chat history for a memo
aiChatRoutes.delete("/history/:memoId", async (c) => {
  const userId = c.get("userId") as string;
  const memoId = c.req.param("memoId");

  // Verify ownership
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, userId },
  });
  if (!memo) {
    return c.json({ error: "Memo not found" }, 404);
  }

  await prisma.aiChatMessage.deleteMany({ where: { memoId } });

  return c.json({ success: true });
});
