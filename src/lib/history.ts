import type { TransformResult, Verdict } from "./types";

export interface HistoryEntry {
  id: string;
  at: number;
  title: string;
  result: TransformResult;
  verdicts: Record<string, Verdict>;
}

const KEY = "unjargon-history-v1";

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 10)));
  } catch { /* storage full or blocked: history is a convenience only */ }
}
