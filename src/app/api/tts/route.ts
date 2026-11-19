import { GoogleGenAI } from "@google/genai";

const VOICES = ["Kore", "Puck", "Charon", "Aoede", "Fenrir"];

/** Wraps raw 16-bit mono PCM in a WAV header so browsers can play it. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string; voice?: string };
    const text = body.text?.trim();
    if (!text) return Response.json({ error: "text is required." }, { status: 400 });
    if (text.length > 3000) return Response.json({ error: "text too long." }, { status: 400 });
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return Response.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
    const voiceName = VOICES.includes(body.voice ?? "") ? body.voice! : "Kore";
    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });

    // Primary: Use modern Interactions API with verbatim text and speech_metadata style
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash-tts",
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text, // Verbatim text to speak - no prompt preamble so audio stays in sync with karaoke
                annotations: [
                  {
                    type: "speech_metadata",
                    style: "clear and calm at a steady teaching pace",
                  },
                ],
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [{ voice: voiceName }],
        },
      });

      if (interaction.output_audio?.data) {
        const audioBuffer = Buffer.from(interaction.output_audio.data, "base64");
        console.log(`[tts] interactions ok (${audioBuffer.length} bytes)`);
        return new Response(new Uint8Array(audioBuffer), {
          headers: {
            "Content-Type": interaction.output_audio.mime_type || "audio/wav",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (e) {
      console.log(`[tts] interactions attempt failed: ${e instanceof Error ? e.message.slice(0, 100) : e}`);
    }

    // Fallback: GenerateContent models with pure verbatim text (NO instruction preamble)
    const fallbackModels = ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview"];
    let lastErr = "TTS unavailable";

    for (const model of fallbackModels) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text }] }], // Only the text itself
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            abortSignal: AbortSignal.timeout(40_000),
          },
        });
        const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (!part?.inlineData?.data) throw new Error("no audio returned");
        const rate = Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1]) || 24000;
        const wav = pcmToWav(Buffer.from(part.inlineData.data, "base64"), rate);
        console.log(`[tts] ${model} ok (${wav.length} bytes)`);
        return new Response(new Uint8Array(wav), {
          headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=86400" },
        });
      } catch (e) {
        lastErr = e instanceof Error ? e.message.slice(0, 160) : "TTS failed";
        console.log(`[tts] ${model} failed: ${lastErr}`);
      }
    }

    return Response.json({ error: lastErr }, { status: 502 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "TTS failed" }, { status: 500 });
  }
}
