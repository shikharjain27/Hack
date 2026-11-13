"use client";

export const LEVELS = ["expert", "grade10", "grade6"] as const;
export type LevelKey = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<LevelKey, string> = { expert: "Expert", grade10: "Grade 10", grade6: "Grade 6" };

export default function LevelSlider({ level, onChange }: { level: LevelKey; onChange: (l: LevelKey) => void }) {
  const idx = LEVELS.indexOf(level);
  return (
    <div className="card p-4">
      <input
        type="range" min={0} max={2} step={1} value={idx}
        onChange={(e) => onChange(LEVELS[Number(e.target.value)])}
        aria-label="Reading level"
        className="w-full accent-indigo-600"
      />
      <div className="mt-1 flex justify-between text-sm">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => onChange(l)} className={l === level ? "font-bold text-indigo-700" : "text-zinc-500"}>
            {LEVEL_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
