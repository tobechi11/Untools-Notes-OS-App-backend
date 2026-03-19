import { Hono } from "hono";

export const realtimeSessionRoutes = new Hono();

realtimeSessionRoutes.post("/session", async (c) => {
  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-mini-realtime-preview",
      modalities: ["audio", "text"],
      input_audio_transcription: { model: process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("OpenAI realtime session error:", res.status, body);
    return c.json({ error: "Failed to create realtime session", detail: body }, 502);
  }

  const data = (await res.json()) as {
    client_secret: { value: string };
  };
  return c.json({ client_secret: data.client_secret.value });
});
