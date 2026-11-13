import { NextResponse } from "next/server";
import type { Part } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON } from "@/lib/gemini";
import { transformSchema } from "@/lib/schema";
import { validateTransform } from "@/lib/validate";
import type { TransformResult } from "@/lib/types";

const SYSTEM_PROMPT = `You turn a dense textbook passage, research document, or PDF page into accessible learning material.
Return JSON matching the schema. Rules:
- source_sentences: verbatim transcription/extraction of the input split into 6-12 key sentences. ids "s1".."sN".
- levels.expert: the source lightly cleaned up. ids "e1".."eN".
- levels.grade10: a Grade 10 reading level. ids "g1".."gN".
- levels.grade6: a Grade 6 reading level, short plain sentences, no undefined jargon, EVERY sentence at most 12 words. ids "k1".."kN".
- Every level sentence lists the source sentence ids it draws from in source_ids (e.g. ["s2","s3"]).
- Keep all numbers, scientific measurements, and core quantitative relationships where possible at expert and grade10.
- glossary: 5-8 terms taken from the source, each with a plain-language explanation and one emoji.
- concept_map: 6-10 nodes (ids "n1".."nN") and edges whose "from"/"to" are node ids, each edge with a short verb label.
- quiz: 5-8 comprehensive items testing key facts, definitions, cause-and-effect mechanisms, and interpretations from the text.
  Each quiz item has:
  * "q": clear question string
  * "options": array of 4 plausible choices
  * "answer": zero-based index of the correct option
  * "source_id": the source sentence id (e.g. "s3") that supports the answer
  * "hint": a helpful, subtle clue to guide the student towards finding the answer
  * "explanation": a concise 1-2 sentence explanation of why the correct option is true based on the source
- diagram_alt_text: alt text describing any diagram or visual in the input, or "" if there is none.
- title: a concise, descriptive title for the passage.`;

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
      fileBase64?: string;
      mimeType?: string;
    };
    const text = body.text?.trim();
    const mediaBase64 = body.fileBase64 || body.imageBase64;
    const mimeType = body.mimeType || (body.fileBase64 ? "application/pdf" : "image/jpeg");

    if (!text && !mediaBase64) {
      return NextResponse.json({ error: "Provide text, an image, or a PDF." }, { status: 400 });
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
    const result = await generateJSON<TransformResult>(parts, transformSchema, SYSTEM_PROMPT, validateTransform);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transform failed" }, { status: 500 });
  }
}
