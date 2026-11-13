import { GoogleGenAI, type Part } from "@google/genai";

export const MODEL = "gemini-3.8-flash";

export async function generateJSON<T>(parts: Part[], schema: object, systemPrompt: string): Promise<T> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  if (!res.text) throw new Error("Empty response from Gemini");
  return JSON.parse(res.text) as T;
}
