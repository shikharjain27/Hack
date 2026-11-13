import type { GlossaryItem, LevelSentence, Metrics } from "./types";

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function computeMetrics(sentences: LevelSentence[], glossary: GlossaryItem[]): Metrics {
  const words = sentences.flatMap((s) => s.text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)));
  const nSent = Math.max(1, sentences.length);
  const nWords = Math.max(1, words.length);
  const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
  const fkGrade = 0.39 * (nWords / nSent) + 11.8 * (syllables / nWords) - 15.59;
  const terms = glossary.map((g) => g.term.toLowerCase());
  const joined = sentences.map((s) => s.text.toLowerCase()).join(" ");
  const glossaryHits = terms.reduce((a, t) => a + (joined.split(t).length - 1), 0);
  const long = words.filter((w) => countSyllables(w) >= 4).length;
  const jargonDensity = Math.min(100, ((long + glossaryHits) / nWords) * 100);
  return {
    fkGrade: Math.max(0, Math.round(fkGrade * 10) / 10),
    avgSentenceLen: Math.round((nWords / nSent) * 10) / 10,
    jargonDensity: Math.round(jargonDensity * 10) / 10,
  };
}
