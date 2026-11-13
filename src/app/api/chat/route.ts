import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateJSON } from "@/lib/gemini";
import type { Sentence } from "@/lib/types";

const schema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    source_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["answer", "source_ids"],
  propertyOrdering: ["answer", "source_ids"],
};

const SYSTEM = `You are a patient tutor. Answer the student's question using ONLY the numbered source sentences provided.
- Write at the requested reading level, in short clear sentences. Use a quick everyday analogy if it helps.
- If the sources do not contain the answer, say so briefly and give the closest relevant fact.
- source_ids: the ids (like "s2") of the source sentences your answer relies on.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      question?: string;
      source_sentences?: Sentence[];
      level?: string;
      history?: { role: "user" | "tutor"; text: string }[];
    };
    if (!body.question?.trim() || !body.source_sentences?.length) {
      return NextResponse.json({ error: "question and source_sentences are required." }, { status: 400 });
    }
    const sources = body.source_sentences.map((s) => `[${s.id}] ${s.text}`).join("\n");
    const hist = (body.history ?? []).slice(-6).map((h) => `${h.role}: ${h.text}`).join("\n");
    const prompt = `Reading level: ${body.level ?? "Grade 6"}\n\nSOURCES:\n${sources}\n\n${hist ? `CONVERSATION SO FAR:\n${hist}\n\n` : ""}QUESTION: ${body.question.trim()}`;
    const result = await generateJSON<{ answer: string; source_ids: string[] }>([{ text: prompt }], schema, SYSTEM);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chat failed" }, { status: 500 });
  }
}
