"use client";

import * as React from "react";
import type { Metrics } from "@/lib/types";
import { Gauge as GaugeIcon, BookOpen, BrainCircuit, Sparkles } from "lucide-react";

interface SemicircleGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  expertValue: number;
  color: string;
  description: string;
  targetText: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SemicircleGauge({
  label,
  value,
  min,
  max,
  unit = "",
  expertValue,
  color,
  description,
  targetText,
  icon: Icon,
}: SemicircleGaugeProps) {
  const clampedVal = Math.min(Math.max(value, min), max);
  const ratio = (clampedVal - min) / (max - min);
  const angle = -90 + ratio * 180;

  const expertRatio = Math.min(Math.max(expertValue, min), max);
  const expertAngle = -90 + ((expertRatio - min) / (max - min)) * 180;

  return (
    <div className="flex flex-col liquid-glass rounded-2xl border border-white/10 p-4 shadow-lg hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-md bg-white/10 text-white/70 shrink-0">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-white/90 leading-tight">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium text-white/60 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0">
          Target: {targetText}
        </span>
      </div>

      {/* SVG Semicircle with Needle strictly inside the upper arc */}
      <div className="relative w-full h-24 my-1 flex items-center justify-center">
        <svg viewBox="0 0 120 70" className="w-40 h-full overflow-visible">
          {/* Background track */}
          <path
            d="M 15 62 A 45 45 0 0 1 105 62"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Colored active arc */}
          <path
            d="M 15 62 A 45 45 0 0 1 105 62"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="141"
            strokeDashoffset={141 - 141 * ratio}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />

          {/* Expert Baseline Ghost Tick */}
          <g
            transform={`rotate(${expertAngle} 60 62)`}
            className="transition-transform duration-500"
          >
            <line
              x1="60"
              y1="12"
              x2="60"
              y2="20"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Needle Indicator */}
          <g
            transform={`rotate(${angle} 60 62)`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="60"
              y1="62"
              x2="60"
              y2="24"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="60" cy="62" r="5" fill="#ffffff" />
            <circle cx="60" cy="62" r="2.5" fill="#09090b" />
          </g>
        </svg>
      </div>

      {/* Prominent numeric display below the needle pivot */}
      <div className="text-center mt-1">
        <div className="text-2xl font-extrabold tracking-tight text-white leading-none">
          {value}
          {unit && <span className="text-sm font-medium text-white/50 ml-0.5">{unit}</span>}
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full flex items-center justify-between text-[11px] text-white/50 mt-2 pt-2 border-t border-white/10">
        <span className="font-medium text-white/70">{description}</span>
        <span className="font-mono text-white/40" title="Expert baseline">
          Exp: {expertValue}{unit}
        </span>
      </div>
    </div>
  );
}

export default function Gauges({ current, expert }: { current: Metrics; expert: Metrics }) {
  const gradeReduction = Math.max(
    0,
    Math.round((expert.fkGrade - current.fkGrade) * 10) / 10
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GaugeIcon className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Readability &amp; Cognitive Load Metrics
          </h3>
        </div>
        {gradeReduction > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Complexity lowered by {gradeReduction} grades
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SemicircleGauge
          label="Flesch-Kincaid Grade"
          value={current.fkGrade}
          min={1}
          max={18}
          targetText="Gr 6-10"
          expertValue={expert.fkGrade}
          color="#818cf8"
          description={current.fkGrade <= 6 ? "Elementary" : current.fkGrade <= 10 ? "High School" : "Collegiate"}
          icon={BookOpen}
        />
        <SemicircleGauge
          label="Avg Sentence Length"
          value={current.avgSentenceLen}
          min={5}
          max={45}
          unit=" w"
          targetText="10-18w"
          expertValue={expert.avgSentenceLen}
          color="#38bdf8"
          description={current.avgSentenceLen <= 14 ? "Bite-sized" : "Compound"}
          icon={BrainCircuit}
        />
        <SemicircleGauge
          label="Jargon Density"
          value={current.jargonDensity}
          min={0}
          max={60}
          unit="%"
          targetText="<15%"
          expertValue={expert.jargonDensity}
          color={current.jargonDensity <= 10 ? "#34d399" : "#fbbf24"}
          description={current.jargonDensity <= 10 ? "Accessible words" : "Heavy terminology"}
          icon={GaugeIcon}
        />
      </div>
    </div>
  );
}
