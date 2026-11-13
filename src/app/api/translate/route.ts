import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateJSON } from "@/lib/gemini";
import { validateTranslate } from "@/lib/validate";

const schema = {
  type: Type.OBJECT,
  properties: {
    sentences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { id: { type: Type.STRING }, text: { type: Type.STRING } },
        required: ["id", "text"],
        propertyOrdering: ["id", "text"],
      },
    },
  },
  required: ["sentences"],
  propertyOrdering: ["sentences"],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      sentences?: { id: string; text: string }[];
      language?: string;
    };
    if (!body.sentences?.length || !body.language) {
      return NextResponse.json({ error: "sentences and language are required." }, { status: 400 });
    }
    const system = `Translate each sentence into ${body.language}. Keep the same ids, the same order, the same simple reading level, and keep numbers, chemical formulas and acronyms (e.g. NADH, CO₂) unchanged. Return one translated sentence per input sentence.`;
    const result = await generateJSON<{ sentences: { id: string; text: string }[] }>(
      [{ text: JSON.stringify(body.sentences) }], schema, system, validateTranslate,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Translate failed" }, { status: 500 });
  }
}
