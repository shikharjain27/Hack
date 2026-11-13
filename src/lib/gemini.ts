import { GoogleGenAI, type Part } from "@google/genai";
import { activeBackups, cleanJson } from "./backup";

// Walking down the chain of current active models with automatic fallback
const CHAIN = [
  process.env.GEMINI_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

// Order: first two Gemini models, then backup providers (if keys exist), then the rest of the Gemini chain.
const EARLY = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statusOf = (e: unknown): number => {
  const s = (e as { status?: number; code?: number })?.status ?? (e as { code?: number })?.code;
  if (typeof s === "number") return s;
  const m = String((e as Error)?.message ?? "").match(/"code":\s*(\d{3})/);
  return m ? Number(m[1]) : 0;
};

export interface GenOptions { json?: boolean; schema?: object; timeoutMs?: number }

type Source = { label: string; run: () => Promise<string> };

function geminiSource(ai: GoogleGenAI, model: string, parts: Part[], system: string, opts: GenOptions): Source {
  return {
    label: model,
    async run() {
      let thinkingOff = true;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts }],
            config: {
              systemInstruction: system,
              ...(opts.json ? { responseMimeType: "application/json", responseSchema: opts.schema } : {}),
              ...(thinkingOff ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
              abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
            },
          });
          if (!res.text) throw new Error("Empty response from Gemini");
          return res.text;
        } catch (e) {
          if (statusOf(e) === 400 && thinkingOff) { thinkingOff = false; continue; } // model rejects thinkingBudget:0
          throw e;
        }
      }
      throw new Error("unreachable");
    },
  };
}

/** Tries each source in order; `accept` parses/validates the text, and a rejection moves on to the next source. */
async function runSources<T>(sources: Source[], accept: (text: string) => T): Promise<T> {
  let lastErr: unknown = new Error("No model available");
  for (const s of sources) {
    try {
      const out = accept(await s.run());
      console.log(`[llm] ${s.label} ok`);
      return out;
    } catch (e) {
      lastErr = e;
      const st = statusOf(e);
      console.log(`[llm] ${s.label} failed (${st || (e as Error).message?.slice(0, 80)})`);
      if (st === 429 || st === 500 || st === 503) await sleep(200);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All AI providers failed");
}

function buildSources(parts: Part[], system: string, opts: GenOptions): Source[] {
  const apiKey = process.env.GOOGLE_API_KEY;
  const gem: Source[] = apiKey
    ? CHAIN.map((m) => geminiSource(new GoogleGenAI({ apiKey }), m, parts, system, opts))
    : [];
  const backups: Source[] = activeBackups().map((b) => ({
    label: b.name,
    run: () => b.call(parts, system, opts.json ? opts.schema : undefined, AbortSignal.timeout(60_000)),
  }));
  if (!gem.length && !backups.length) throw new Error("No AI provider configured: set GOOGLE_API_KEY in .env");
  return [...gem.slice(0, EARLY), ...backups, ...gem.slice(EARLY)];
}

export async function generateText(parts: Part[], systemInstruction: string, opts: GenOptions = {}): Promise<string> {
  return runSources(buildSources(parts, systemInstruction, opts), (t) => t);
}

export async function generateJSON<T>(
  parts: Part[], schema: object, systemInstruction: string, validate?: (value: unknown) => void,
): Promise<T> {
  return runSources(buildSources(parts, systemInstruction, { json: true, schema }), (text) => {
    const value = JSON.parse(cleanJson(text));
    validate?.(value); // throws if a provider returned the wrong shape, so the next provider is tried
    return value as T;
  });
}
