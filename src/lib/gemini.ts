import { GoogleGenAI, type Part } from "@google/genai";

// gemini-2.5-flash (the plan's model) is no longer available to new keys, and any single model
// can be overloaded (503), so we walk down a chain of models until one answers.
const CHAIN = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statusOf = (e: unknown): number => {
  const s = (e as { status?: number; code?: number })?.status ?? (e as { code?: number })?.code;
  if (typeof s === "number") return s;
  const m = String((e as Error)?.message ?? "").match(/"code":\s*(\d{3})/);
  return m ? Number(m[1]) : 0;
};

export interface GenOptions { json?: boolean; schema?: object; timeoutMs?: number }

/** Runs one request against the model chain with retries. Returns raw text. */
export async function generateText(parts: Part[], systemInstruction: string, opts: GenOptions = {}): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown = new Error("No model available");

  for (const model of CHAIN) {
    let thinkingOff = true;
    for (let attempt = 0; attempt < 2; attempt++) {
      // a second attempt is only used after dropping the thinking config (400); overloads move to the next model
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction,
            ...(opts.json ? { responseMimeType: "application/json", responseSchema: opts.schema } : {}),
            ...(thinkingOff ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
          },
        });
        const text = res.text;
        if (!text) throw new Error("Empty response from Gemini");
        console.log(`[gemini] ${model} ok`);
        return text;
      } catch (e) {
        lastErr = e;
        const st = statusOf(e);
        console.log(`[gemini] ${model} attempt ${attempt + 1} failed (${st || (e as Error).name})`);
        if (st === 400 && thinkingOff) { thinkingOff = false; attempt--; continue; } // model rejects thinkingBudget:0
        if (st === 404 || st === 403) break; // model not available to this key: next model
        if (st === 429 || st === 500 || st === 503 || st === 0) { await sleep(300); break; } // overloaded: next model
        break;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini request failed");
}

export async function generateJSON<T>(parts: Part[], schema: object, systemInstruction: string): Promise<T> {
  const text = await generateText(parts, systemInstruction, { json: true, schema });
  return JSON.parse(text) as T;
}
