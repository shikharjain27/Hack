type Obj = Record<string, unknown>;
const need = (cond: unknown, msg: string) => { if (!cond) throw new Error(`invalid AI response: ${msg}`); };
const arr = (v: unknown, min = 1) => Array.isArray(v) && v.length >= min;

export function validateTransform(v: unknown) {
  const r = v as Obj;
  need(typeof r?.title === "string", "title");
  need(arr(r.source_sentences), "source_sentences");
  const levels = r.levels as Obj;
  for (const k of ["expert", "grade10", "grade6"]) {
    need(arr(levels?.[k]), `levels.${k}`);
    for (const s of levels[k] as Obj[]) need(typeof s.text === "string" && Array.isArray(s.source_ids), `${k} sentence`);
  }
  need(arr(r.glossary), "glossary");
  const cm = r.concept_map as Obj;
  need(arr(cm?.nodes) && Array.isArray(cm?.edges), "concept_map");
  need(arr(r.quiz), "quiz");
  for (const q of r.quiz as Obj[]) {
    need(arr(q.options, 2) && typeof q.answer === "number", "quiz item");
    if (typeof q.hint !== "string") q.hint = "";
    if (typeof q.explanation !== "string") q.explanation = "";
  }
  if (typeof r.diagram_alt_text !== "string") r.diagram_alt_text = "";
  if (!Array.isArray(r.preserved_terms)) r.preserved_terms = [];
  if (!Array.isArray(r.atomic_facts)) r.atomic_facts = [];
}

export function validateVerify(v: unknown) {
  const r = v as Obj;
  need(arr(r?.verdicts), "verdicts");
  for (const x of r.verdicts as Obj[]) {
    need(typeof x.id === "string" && typeof x.faithful === "boolean", "verdict");
    if (!Array.isArray(x.dropped_facts)) x.dropped_facts = [];
    if (typeof x.note !== "string") x.note = "";
  }
}

export function validateChat(v: unknown) {
  const r = v as Obj;
  need(typeof r?.answer === "string" && r.answer.length > 0, "answer");
  if (!Array.isArray(r.source_ids)) r.source_ids = [];
}

export function validateTranslate(v: unknown) {
  const r = v as Obj;
  need(arr(r?.sentences), "sentences");
  for (const s of r.sentences as Obj[]) need(typeof s.text === "string", "translated sentence");
}
