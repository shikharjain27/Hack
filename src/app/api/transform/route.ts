import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { transformSchema } from "@/lib/schema";
import type { TransformResult } from "@/lib/types";
import fixture from "@/lib/fixtures/sample-result.json";

const SYSTEM_PROMPT = `You are an accessible-learning assistant. Given a dense textbook passage (text or photo), produce JSON matching the schema.
Rules:
- source_sentences: verbatim transcription of the input split into 6-12 sentences, ids "s1".."sN".
- levels.expert: lightly cleaned version of the original, ids "e1".."eN". levels.grade10: ids "g1".."gN". levels.grade6: ids "k1".."kN"; every sentence at most 12 words, no undefined jargon.
- Every level sentence lists the source sentence ids it is derived from in source_ids. Preserve all facts, numbers and quantities where possible.
- glossary: 5-8 terms taken from the source, with a plain-language definition and one emoji.
- concept_map: 6-10 nodes (ids "n1".."nN"); every edge's from/to must be a node id; edge label is a short verb phrase.
- quiz: exactly 3 items, each with 4 options, answer = index (0-3) of the correct option, source_id = the source sentence that supports it.
- diagram_alt_text: describe any diagram in the input, or "" if there is none.`;

export async function POST(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("mock") === "1") {
      return NextResponse.json((fixture as unknown as { transform: TransformResult }).transform);
    }
    const { text, imageBase64, mimeType } = (await req.json()) as {
      text?: string;
      imageBase64?: string;
      mimeType?: string;
    };
    if (!text?.trim() && !imageBase64) {
      return NextResponse.json({ error: "Provide text or an image." }, { status: 400 });
    }
    const parts = [];
    if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
    if (text?.trim()) parts.push({ text });
    const result = await generateJSON<TransformResult>(parts, transformSchema, SYSTEM_PROMPT);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transform failed" }, { status: 500 });
  }
}
