import { Hono } from "hono";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transcribeRoutes = new Hono();

transcribeRoutes.post("/", async (c) => {
  const formData = await c.req.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  const model = process.env.OPENAI_WHISPER_MODEL ?? "whisper-1";

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model,
      response_format: "text",
    });

    return c.json({ text: transcription });
  } catch (err: any) {
    console.error("Transcription error:", err.message);
    return c.json({ error: "Transcription failed" }, 500);
  }
});
