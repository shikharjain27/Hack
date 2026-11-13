import type { TransformResult } from "./types";

const LABELS = { expert: "Expert", grade10: "Grade 10", grade6: "Grade 6" } as const;

export function toMarkdown(r: TransformResult): string {
  const lines: string[] = [`# ${r.title}`, ""];
  (["grade6", "grade10", "expert"] as const).forEach((k) => {
    lines.push(`## ${LABELS[k]} version`, "", r.levels[k].map((s) => s.text).join(" "), "");
  });
  lines.push("## Key terms", "");
  r.glossary.forEach((g) => lines.push(`- ${g.emoji} **${g.term}** — ${g.plain}`));
  lines.push("", "## Concept map", "");
  const label = new Map(r.concept_map.nodes.map((n) => [n.id, n.label]));
  r.concept_map.edges.forEach((e) => lines.push(`- ${label.get(e.from)} —(${e.label})→ ${label.get(e.to)}`));
  lines.push("", "## Quiz", "");
  r.quiz.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.q}`);
    q.options.forEach((o, oi) => lines.push(`   - ${"abcd"[oi]}) ${o}${oi === q.answer ? "  ✅" : ""}`));
  });
  if (r.diagram_alt_text) lines.push("", "## Diagram description", "", r.diagram_alt_text);
  return lines.join("\n");
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
