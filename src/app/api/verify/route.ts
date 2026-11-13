import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON } from "@/lib/gemini";
import { verifySchema } from "@/lib/schema";
import { validateVerify } from "@/lib/validate";
import type { TransformResult, VerifyResult } from "@/lib/types";

const SYSTEM_PROMPT = `You are a strict fact-checker for simplified textbook text.
For EVERY sentence in levels.grade10 and levels.grade6 (return exactly one verdict per sentence, using its id), compare it with the source sentences it cites in source_ids.
List in dropped_facts any facts, numbers or quantities from the cited source sentences that were lost or distorted (e.g. "produces 2 CO₂"). Be strict: every number, quantity, named molecule or product in the cited source sentences that is missing from the simplified sentence counts as dropped, even if the sentence is otherwise accurate (a sentence citing several facts that mentions only some of them is NOT faithful). Set faithful=false if anything is dropped or distorted, otherwise true with an empty dropped_facts. note is one short sentence.`;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("mock") === "1") {
      const file = path.join(process.cwd(), "src/lib/fixtures/sample-verify.json");
      return NextResponse.json(JSON.parse(await fs.readFile(file, "utf8")));
    }
    const body = (await req.json().catch(() => ({}))) as Partial<Pick<TransformResult, "source_sentences" | "levels">>;
    if (!body.source_sentences?.length || !body.levels) {
      return NextResponse.json({ error: "source_sentences and levels are required." }, { status: 400 });
    }
    const payload = JSON.stringify({
      source_sentences: body.source_sentences,
      grade10: body.levels.grade10,
      grade6: body.levels.grade6,
    });
    const result = await generateJSON<VerifyResult>([{ text: payload }], verifySchema, SYSTEM_PROMPT, validateVerify);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Verify failed" }, { status: 500 });
  }
}
