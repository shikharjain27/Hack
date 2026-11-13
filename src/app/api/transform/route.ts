import { NextResponse } from "next/server";
import type { Part } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON } from "@/lib/gemini";
import { transformSchema } from "@/lib/schema";
import { validateTransform } from "@/lib/validate";
import type { TransformResult } from "@/lib/types";

const SYSTEM_PROMPT = `You turn a dense textbook passage (text or a photo of a page) into accessible learning material.
Return JSON matching the schema. Rules:
- source_sentences: verbatim transcription of the input split into 6-12 sentences. ids "s1".."sN".
- levels.expert: the source lightly cleaned up. ids "e1".."eN". levels.grade10: a Grade 10 reading level. ids "g1".."gN". levels.grade6: a Grade 6 reading level, short plain sentences, no undefined jargon, EVERY sentence at most 12 words. ids "k1".."kN".
- Every level sentence lists the source sentence ids it draws from in source_ids (e.g. ["s2","s3"]).
- Keep all numbers and quantities where possible at expert and grade10.
- glossary: 5-8 terms taken from the source, each with a plain-language explanation and one emoji.
- concept_map: 6-10 nodes (ids "n1".."nN") and edges whose "from"/"to" are node ids, each edge with a short verb label.
- quiz: exactly 3 items, each with 4 options, "answer" = zero-based index of the correct option, and "source_id" = the source sentence id that supports the answer.
- diagram_alt_text: alt text describing any diagram in the input, or "" if there is none.
- title: a short title for the passage.`;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("mock") === "1") {
      const file = path.join(process.cwd(), "src/lib/fixtures/sample-result.json");
      const fixture = JSON.parse(await fs.readFile(file, "utf8"));
      return NextResponse.json(fixture.transform ?? fixture);
    }
    const body = (await req.json().catch(() => ({}))) as {
      text?: string;
      imageBase64?: string;
      mimeType?: string;
    };
    const text = body.text?.trim();
    if (!text && !body.imageBase64) {
      return NextResponse.json({ error: "Provide text or an image." }, { status: 400 });
    }
    const parts: Part[] = [];
    if (body.imageBase64) {
      parts.push({ inlineData: { data: body.imageBase64, mimeType: body.mimeType || "image/jpeg" } });
    }
    parts.push({ text: text || "Transcribe and transform the textbook page in the image." });
    const result = await generateJSON<TransformResult>(parts, transformSchema, SYSTEM_PROMPT, validateTransform);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transform failed" }, { status: 500 });
  }
}
