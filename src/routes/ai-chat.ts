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

type Provider = "openai" | "anthropic" | "openai-mini";

function pickProvider(model: ModelId, _lastMessage: string): Provider {
  if (model === "claude") return "anthropic";
  if (model === "gpt5") return "openai";
  // Auto → gpt-4.1-mini (fast, cheap, good enough for most tasks)
  return "openai-mini";
}

const TONE_RULES = `
Rules:
- Never use filler phrases like "Here you go", "Certainly", "Sure!", "Of course!", "Here it is", "Let me help", "I'd be happy to", "Great question", or similar.
- Start directly with the content. If asked to rewrite text, output the rewritten text immediately.
- Be concise. No preamble, no sign-offs, no "Let me know if you need anything else."
- Match the user's tone and formality level.
- When providing revised text, write it so the user can copy-paste it directly into their document.

CRITICAL — Preserve tags and nodes:
- The document contains structured nodes (like @Decision, @Risk, @Assumption, @Outcome, @Metric, @Status, @ReviewDate, @Confidence, etc.) and inline #tags (like #growth, #hiring, etc.).
- You MUST preserve ALL existing structured nodes and inline tags in your output. Never remove, rename, or alter them.
- If you rewrite or improve text, keep every @NodeType and #tag exactly as it appears in the original.
- If you add new content, you may suggest new nodes or tags, but never at the expense of existing ones.
- This is non-negotiable — losing nodes or tags breaks the document's structured data.`.trim();

function buildSystemPrompt(
  selectedText: string,
  fullMemoContent?: string
): string {
  if (selectedText.trim()) {
    return `You are a writing assistant for decision memos. The user selected this text from their document:

---
${selectedText}
---

Improve, refine, or transform it based on their instructions. Output clean text ready to paste back into the document.

${TONE_RULES}`;
  }

  if (fullMemoContent?.trim()) {
    return `You are a writing assistant for decision memos. Here is the full memo:

---
${fullMemoContent}
---

Answer questions or provide improvements based on the user's instructions. When rewriting, output clean text ready to paste.

${TONE_RULES}`;
  }

  return `You are a writing assistant for decision memos. Help with writing, editing, and brainstorming.

${TONE_RULES}`;
}

type Env = { Variables: { userId: string; userEmail: string } };

export const aiChatRoutes = new Hono<Env>();

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

  const lastUserMessage =
    messages.findLast((m) => m.role === "user")?.content ?? "";
  const provider = pickProvider(model, lastUserMessage);
  const systemPrompt = buildSystemPrompt(selectedText, fullMemoContent);

  return streamSSE(c, async (stream) => {
    try {
      if (provider === "openai" || provider === "openai-mini") {
        const openaiModel =
          provider === "openai-mini" ? "gpt-4.1-mini" : "gpt-4o";
        const completion = await openai.chat.completions.create({
          model: openaiModel,
          stream: true,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        });

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            await stream.writeSSE({ data: JSON.stringify({ text }) });
          }
        }
      } else {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
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
            await stream.writeSSE({
              data: JSON.stringify({ text: event.delta.text }),
            });
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
    select: {
      id: true,
      role: true,
      content: true,
      model: true,
      createdAt: true,
    },
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
