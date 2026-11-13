"use client";
import type { Metrics } from "@/lib/types";

function Gauge({ label, value, ghost, max, unit }: { label: string; value: number; ghost: number; max: number; unit?: string }) {
  const angle = (v: number) => -90 + Math.min(1, Math.max(0, v / max)) * 180;
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return [60 + r * Math.sin(rad), 60 - r * Math.cos(rad)];
  };
  const [gx1, gy1] = pt(angle(ghost), 38);
  const [gx2, gy2] = pt(angle(ghost), 52);
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white p-3">
      <svg viewBox="0 0 120 70" className="w-full">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e4e4e7" strokeWidth="10" />
        <line x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke="#a1a1aa" strokeWidth="2" strokeDasharray="2 2" />
        <g style={{ transform: `rotate(${angle(value)}deg)`, transformOrigin: "60px 60px", transition: "transform 0.7s ease" }}>
          <line x1="60" y1="60" x2="60" y2="18" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="60" r="4" fill="#4f46e5" />
      </svg>
      <div className="text-lg font-semibold">{value}{unit}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function Gauges({ current, expert }: { current: Metrics; expert: Metrics }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Gauge label="Flesch-Kincaid grade" value={current.fkGrade} ghost={expert.fkGrade} max={20} />
      <Gauge label="Avg sentence length" value={current.avgSentenceLen} ghost={expert.avgSentenceLen} max={40} unit=" w" />
      <Gauge label="Jargon density" value={current.jargonDensity} ghost={expert.jargonDensity} max={60} unit="%" />
    </div>
  );
}
