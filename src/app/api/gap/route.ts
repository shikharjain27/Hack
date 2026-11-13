import { NextResponse } from "next/server";
import { Type, type Schema } from "@google/genai";
import { generateJSON } from "@/lib/gemini";
import type { Sentence } from "@/lib/types";

export interface MisconceptionReport {
  score: number; // 0 - 100
  summary: string;
  strengths: string[];
  misconceptions: {
    claim: string;
    gap: string;
    correction: string;
    relatedSentenceId?: string;
  }[];
  bridgingExplanation: string;
  encouragement: string;
}

const gapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "Alignment score from 0 to 100 on how accurately and thoroughly the student understood the passage.",
    },
    summary: {
      type: Type.STRING,
      description: "A 1-2 sentence assessment of the student's current conceptual grasp.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 specific concepts, facts, or nuances the student got right.",
    },
    misconceptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING, description: "What the student said or implied that was mistaken or incomplete." },
          gap: { type: Type.STRING, description: "Why that is a misconception or what crucial detail was omitted." },
          correction: { type: Type.STRING, description: "The accurate concept explained in clear, encouraging terms." },
          relatedSentenceId: { type: Type.STRING, description: "Source sentence ID that supports this correction, e.g. s1." },
        },
        required: ["claim", "gap", "correction"],
      },
      description: "List of misconceptions, inaccuracies, or key omitted concepts found in the student's text.",
    },
    bridgingExplanation: {
      type: Type.STRING,
      description: "A concise, supportive paragraph that connects the dots and bridges the student's understanding to full mastery.",
    },
    encouragement: {
      type: Type.STRING,
      description: "A warm, motivating closing sentence for the student.",
    },
  },
  required: ["score", "summary", "strengths", "misconceptions", "bridgingExplanation", "encouragement"],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      userUnderstanding?: string;
      sourceSentences?: Sentence[];
      level?: string;
    };

    const userText = body.userUnderstanding?.trim();
    if (!userText) {
      return NextResponse.json(
        { error: "Please enter your thoughts or summary of what you understood." },
        { status: 400 }
      );
    }

    const sentences = body.sourceSentences ?? [];
    const sourceContext = sentences.map((s) => `[${s.id}] ${s.text}`).join("\n");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY is not configured." }, { status: 500 });
    }

    const prompt = `You are a supportive, insightful educational mentor using the Feynman Technique diagnostic.
The student has just read a textbook passage and wrote what they understood in their own words.

GROUND TRUTH SOURCE SENTENCES:
${sourceContext || "No explicit sentences provided. Evaluate based on scientific and factual accuracy."}

STUDENT'S EXPLANATION:
"${userText}"

TARGET READING LEVEL: ${body.level || "Grade 10"}

YOUR TASK:
1. Compare the student's understanding directly against the ground truth.
2. Identify what they genuinely understood (strengths).
3. Identify subtle or blatant misconceptions, confusions, or missing critical cause-effect links (misconceptions).
4. Provide a gentle, clear correction for each gap, citing the relevant source sentence ID if applicable.
5. Offer a bridging explanation that synthesizes the entire idea into a clear mental model.
6. Rate overall conceptual alignment from 0 to 100%.

Return pure JSON matching the provided schema.`;

    const parsed = await generateJSON<MisconceptionReport>(
      [{ text: prompt }],
      gapSchema,
      "You are an educational AI diagnostics expert. Return valid JSON only.",
      (val) => {
        const obj = val as Record<string, unknown>;
        if (typeof obj?.score !== "number" || !Array.isArray(obj?.strengths)) {
          throw new Error("Invalid gap diagnostic format");
        }
      }
    );

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Misconception diagnosis failed." },
      { status: 500 }
    );
  }
}
