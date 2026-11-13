export interface Sentence { id: string; text: string }
export interface LevelSentence { id: string; text: string; source_ids: string[] }
export interface GlossaryItem { term: string; plain: string; emoji: string }
export interface ConceptNode { id: string; label: string }
export interface ConceptEdge { from: string; to: string; label: string }
export interface QuizItem { q: string; options: string[]; answer: number; source_id: string }
export interface TransformResult {
  title: string;
  source_sentences: Sentence[];
  levels: { expert: LevelSentence[]; grade10: LevelSentence[]; grade6: LevelSentence[] };
  glossary: GlossaryItem[];
  concept_map: { nodes: ConceptNode[]; edges: ConceptEdge[] };
  quiz: QuizItem[];
  diagram_alt_text: string;
}
export interface Verdict { id: string; faithful: boolean; dropped_facts: string[]; note: string }
export interface VerifyResult { verdicts: Verdict[] }
export interface Metrics { fkGrade: number; avgSentenceLen: number; jargonDensity: number }

export type ReadingLevel = "expert" | "grade10" | "grade6";
export interface StudentProfile {
  id: string;
  full_name: string;
  school: string;
  grade: number | null;
  preferred_level: ReadingLevel;
  dyslexia_font: boolean;
  tts_speed: number;
  created_at: string;
  updated_at: string;
}
