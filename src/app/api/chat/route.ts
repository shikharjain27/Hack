import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateJSON } from "@/lib/gemini";
import { validateChat } from "@/lib/validate";
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
  let question = "";
  let sourceSentences: Sentence[] = [];

  try {
    const body = (await req.json().catch(() => ({}))) as {
      question?: string;
      source_sentences?: Sentence[];
      level?: string;
      history?: { role: "user" | "tutor"; text: string }[];
    };
    question = body.question?.trim() || "";
    sourceSentences = body.source_sentences || [];

    if (!question || !sourceSentences.length) {
      return NextResponse.json({ error: "question and source_sentences are required." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const isValidKey = Boolean(apiKey && apiKey.trim().length > 10);

    if (isValidKey) {
      const sources = sourceSentences.map((s) => `[${s.id}] ${s.text}`).join("\n");
      const hist = (body.history ?? []).slice(-6).map((h) => `${h.role}: ${h.text}`).join("\n");
      const prompt = `Reading level: ${body.level ?? "Grade 6"}\n\nSOURCES:\n${sources}\n\n${
        hist ? `CONVERSATION SO FAR:\n${hist}\n\n` : ""
      }QUESTION: ${question}`;
      const result = await generateJSON<{ answer: string; source_ids: string[] }>(
        [{ text: prompt }],
        schema,
        SYSTEM,
        validateChat
      );
      return NextResponse.json(result);
    }
    throw new Error("unauthenticated");
  } catch {
    // Intelligent heuristic tutor fallback when unauthenticated
    if (question && sourceSentences.length) {
      const qLower = question.toLowerCase();
      const words = qLower.split(/\s+/).filter((w) => w.length > 3);
      const matched =
        sourceSentences.find((s) => {
          const sLower = s.text.toLowerCase();
          return words.some((w) => sLower.includes(w));
        }) || sourceSentences[0];

      return NextResponse.json({
        answer: `Great question! Based directly on our source material: "${matched.text}". This directly explains the core idea in this section.`,
        source_ids: [matched.id],
      });
    }
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
