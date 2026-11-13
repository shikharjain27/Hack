import { GoogleGenAI, type Part } from "@google/genai";

export const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"; // plan said gemini-2.5-flash, which is no longer available to new keys

export async function generateJSON<T>(parts: Part[], schema: object, systemInstruction: string): Promise<T> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text) as T;
}
