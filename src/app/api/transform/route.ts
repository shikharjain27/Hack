import { NextResponse } from "next/server";
import type { Part } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON } from "@/lib/gemini";
import { transformSchema } from "@/lib/schema";
import { validateTransform } from "@/lib/validate";
import type { TransformResult } from "@/lib/types";

const SYSTEM_PROMPT = `You turn a dense textbook passage, research document, or PDF page into accessible learning material using Entity-Locked Scaffolding.
Return JSON matching the schema. Follow this strict rule set:

### 1. Step 1 — Extract preserved_terms & atomic_facts
- preserved_terms: Extract 6-12 domain-specific keywords, acronyms, algorithms, protocols, proper nouns, ports/numbers, and technical terms from the source passage. Each has "term", "category", and "definition" (plain English explanation).
- atomic_facts: Extract 4-8 core factual conditions, invariant rules, and operational relationships from the source.

### 2. Step 2 — Zero-Deletion Constraint (100% Keyword & Fact Retention)
- Every single term in preserved_terms and every factual condition in atomic_facts MUST be preserved verbatim in both levels.grade10 and levels.grade6.
- NEVER delete, drop, or replace technical keywords with vague or dumbed-down analogies (e.g. NEVER substitute "OSPF" or "Dijkstra's algorithm" with "other protocols", NEVER drop "NLRI", "AS_PATH", "port 179", "TLB", "MMU", "Vector 14", "black-height", etc.).

### 3. Step 3 — Inline Plain-English Scaffolding
- Simplify ONLY the surrounding dense academic clauses, convoluted passive voice, and filler syntax into crisp, punchy, active-voice sentences.
- When a complex technical term appears, keep the exact term verbatim and append a brief, plain-English inline explanation in parentheses (e.g., "NLRI (Network Layer Reachability Information—lists of reachable IP networks)").

### Structural Schema Rules:
- source_sentences: verbatim transcription/extraction of the input split into 4-8 key sentences. ids "s1".."sN".
- levels.expert: the source lightly cleaned up. ids "e1".."eN".
- levels.grade10: Grade 10 clarity. Crisp active voice, preserves ALL preserved_terms verbatim with inline scaffolding. ids "g1".."gN".
- levels.grade6: Grade 6 plain language. Short punchy sentences. Retains ALL technical keywords verbatim, explaining their role simply. ids "k1".."kN".
- Every level sentence lists the source sentence ids it draws from in source_ids (e.g. ["s2","s3"]).
- glossary: 6-10 terms from the source, each with a plain-language explanation and one emoji.
- concept_map: 6-10 nodes (ids "n1".."nN") and edges whose "from"/"to" are node ids, each with a short verb label.
- quiz: 5-8 comprehensive items testing key facts, definitions, cause-and-effect mechanisms, and interpretations from the text.
- diagram_alt_text: alt text describing any diagram or visual in the input, or "" if there is none.
- title: a concise, descriptive title for the passage.`;

const SAMPLE_FIXTURES: Record<string, string> = {
  dsa: "sample-dsa.json",
  networking: "sample-networking.json",
  os: "sample-os.json",
  // Legacy aliases
  krebs: "sample-dsa.json",
  quantum: "sample-networking.json",
  law: "sample-os.json",
};

export function detectSampleId(text?: string): "dsa" | "networking" | "os" | "krebs" | "quantum" | "law" | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (
    lower.includes("red-black") ||
    lower.includes("black-height") ||
    lower.includes("tree rotation") ||
    lower.includes("structural invariants") ||
    lower.includes("binary search tree") ||
    lower.includes("pyruvate") ||
    lower.includes("krebs")
  ) {
    return "dsa";
  }
  if (
    lower.includes("border gateway protocol") ||
    lower.includes("bgp") ||
    lower.includes("autonomous system") ||
    lower.includes("as_path") ||
    lower.includes("local_pref") ||
    lower.includes("multi-exit discriminator") ||
    lower.includes("nlri") ||
    lower.includes("quantum")
  ) {
    return "networking";
  }
  if (
    lower.includes("virtual memory") ||
    lower.includes("page table") ||
    lower.includes("tlb") ||
    lower.includes("translation lookaside") ||
    lower.includes("page fault") ||
    lower.includes("mmu") ||
    lower.includes("demand paging") ||
    lower.includes("vma") ||
    lower.includes("commerce")
  ) {
    return "os";
  }
  return null;
}

async function loadSampleFixture(id: string): Promise<TransformResult> {
  const filename = SAMPLE_FIXTURES[id] ?? SAMPLE_FIXTURES.dsa;
  const file = path.join(process.cwd(), "src/lib/fixtures", filename);
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  return raw.transform ?? raw;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const mockParam = url.searchParams.get("mock");
    if (mockParam) {
      const sampleId =
        mockParam === "1"
          ? "dsa"
          : mockParam in SAMPLE_FIXTURES
            ? mockParam
            : "dsa";
      const fixture = await loadSampleFixture(sampleId);
      return NextResponse.json(fixture, {
        headers: { "X-Unjargon-Cached": "1" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      text?: string;
      imageBase64?: string;
      fileBase64?: string;
      mimeType?: string;
    };
    const text = body.text?.trim();
    const mediaBase64 = body.fileBase64 || body.imageBase64;
    const mimeType = body.mimeType || (body.fileBase64 ? "application/pdf" : "image/jpeg");

    if (!text && !mediaBase64) {
      return NextResponse.json({ error: "Provide text, an image, or a PDF." }, { status: 400 });
    }

    const sampleId = detectSampleId(text);
    const apiKey = process.env.GOOGLE_API_KEY;
    const isValidKey = Boolean(apiKey && apiKey.trim().length > 10);

    // If input matches a built-in sample and API key is not an active AI Studio key, return cached fixture immediately
    if (sampleId && !isValidKey && !mediaBase64) {
      const fixture = await loadSampleFixture(sampleId);
      return NextResponse.json(fixture, {
        headers: { "X-Unjargon-Cached": "1" },
      });
    }

    const parts: Part[] = [];
    if (mediaBase64) {
      parts.push({
        inlineData: {
          data: mediaBase64,
          mimeType: mimeType,
        },
      });
    }
    parts.push({
      text:
        text ||
        (mimeType === "application/pdf"
          ? "Read this PDF textbook document, extract the core subject matter, and transform it into accessible tiers."
          : "Transcribe and transform the textbook page in the image."),
    });

    let result: TransformResult;
    try {
      result = await generateJSON<TransformResult>(parts, transformSchema, SYSTEM_PROMPT, validateTransform);
    } catch (llmError) {
      // If live Gemini call fails and input matches any built-in sample, fall back to cached fixture
      if (sampleId) {
        const fixture = await loadSampleFixture(sampleId);
        return NextResponse.json(fixture, {
          headers: { "X-Unjargon-Cached": "1" },
        });
      }
      throw llmError;
    }
    return NextResponse.json(result);
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Transform failed";
    if (
      typeof msg === "string" &&
      (msg.includes("401") ||
        msg.includes("UNAUTHENTICATED") ||
        msg.includes("API key not valid") ||
        msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED"))
    ) {
      msg =
        "Invalid Gemini API Key: Please check the GOOGLE_API_KEY in your .env file. You can obtain or refresh your key from Google AI Studio (https://aistudio.google.com/app/apikey).";
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
