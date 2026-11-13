import type { Part } from "@google/genai";

/**
 * Backup LLM providers, used when Gemini is overloaded or rate-limited.
 * A provider is active only if its key is set in .env:
 *   ANTHROPIC_API_KEY  (+ optional ANTHROPIC_MODEL)
 *   OPENAI_API_KEY     (+ optional OPENAI_MODEL, OPENAI_BASE_URL for Groq/OpenRouter/etc.)
 * Called with plain fetch, so no extra dependencies.
 */

export interface BackupProvider {
  name: string;
  call: (parts: Part[], system: string, jsonSchema?: object, signal?: AbortSignal) => Promise<string>;
}

/** Converts a Gemini-style schema (Type.OBJECT = "OBJECT") into plain JSON Schema for the prompt. */
export function toJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toJsonSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "propertyOrdering") continue;
      out[k] = k === "type" && typeof v === "string" ? v.toLowerCase() : toJsonSchema(v);
    }
    return out;
  }
  return node;
}

function jsonInstruction(schema?: object): string {
  return schema
    ? `\n\nReturn ONLY a single valid JSON object (no markdown fences, no commentary) that matches this JSON Schema exactly. Every field is required:\n${JSON.stringify(toJsonSchema(schema))}`
    : "";
}

const textOf = (parts: Part[]) => parts.map((p) => p.text).filter(Boolean).join("\n\n");
const images = (parts: Part[]) => parts.filter((p) => p.inlineData?.data).map((p) => p.inlineData!);

async function post(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data).slice(0, 160)}`);
  return data;
}

const anthropic: BackupProvider = {
  name: "anthropic",
  async call(parts, system, schema, signal) {
    const content = [
      ...images(parts).map((i) => ({ type: "image", source: { type: "base64", media_type: i.mimeType || "image/jpeg", data: i.data } })),
      { type: "text", text: textOf(parts) },
    ];
    const data = await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      { model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 8000, system: system + jsonInstruction(schema), messages: [{ role: "user", content }] },
      signal,
    );
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text;
    if (!text) throw new Error("empty response");
    return text;
  },
};

const openai: BackupProvider = {
  name: "openai-compatible",
  async call(parts, system, schema, signal) {
    const content = [
      ...images(parts).map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType || "image/jpeg"};base64,${i.data}` } })),
      { type: "text", text: textOf(parts) },
    ];
    const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const data = await post(
      `${base}/chat/completions`,
      { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: system + jsonInstruction(schema) }, { role: "user", content }],
        ...(schema ? { response_format: { type: "json_object" } } : {}),
      },
      signal,
    );
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("empty response");
    return text;
  },
};

export function activeBackups(): BackupProvider[] {
  const list: BackupProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY?.trim()) list.push(anthropic);
  if (process.env.OPENAI_API_KEY?.trim()) list.push(openai);
  return list;
}

/** Strips ```json fences some models add despite instructions. */
export function cleanJson(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}
