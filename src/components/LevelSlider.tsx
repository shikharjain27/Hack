"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, School } from "lucide-react";

export const LEVELS = ["expert", "grade10", "grade6"] as const;
export type LevelKey = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<LevelKey, string> = {
  expert: "Expert",
  grade10: "Grade 10",
  grade6: "Grade 6",
};

interface LevelSliderProps {
  level: LevelKey;
  onChange: (level: LevelKey) => void;
  className?: string;
  disabled?: boolean;
}

const LEVEL_ITEMS: Array<{
  value: LevelKey;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: "expert",
    label: "Expert",
    badge: "Original",
    icon: GraduationCap,
    description: "Academic Textbook Prose",
  },
  {
    value: "grade10",
    label: "Grade 10",
    badge: "Standard",
    icon: BookOpen,
    description: "High School Clarity",
  },
  {
    value: "grade6",
    label: "Grade 6",
    badge: "Accessible",
    icon: School,
    description: "Everyday Plain Language",
  },
];

export default function LevelSlider({
  level,
  onChange,
  className,
  disabled = false,
}: LevelSliderProps) {
  const reduceMotion = useReducedMotion();
  const buttonsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const pillId = React.useId();

  const currentIndex = LEVELS.indexOf(level);

  function selectByIndex(nextIndex: number) {
    const clamped = Math.max(0, Math.min(LEVELS.length - 1, nextIndex));
    onChange(LEVELS[clamped]);
    buttonsRef.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (disabled) return;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: LEVELS.length - 1,
    };

    if (event.key in moves) {
      event.preventDefault();
      selectByIndex(moves[event.key]);
    }
  }

  return (
    <div className={cn("flex flex-col space-y-2.5 liquid-glass rounded-2xl p-4 border border-white/10 shadow-lg", className)}>
      <div className="flex items-center justify-between text-xs font-medium text-white/50">
        <span className="flex items-center gap-1.5 font-semibold text-white/90">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Reading Level Spectrum
        </span>
        <span className="text-white/40 font-mono text-[11px]">
          Tier {currentIndex + 1} of 3 • {LEVEL_LABELS[level]}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Reading Level Selector"
        className={cn(
          "relative grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-1.5 shadow-inner transition-colors",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {LEVEL_ITEMS.map((item, index) => {
          const isSelected = item.value === level;
          const Icon = item.icon;

          return (
            <button
              key={item.value}
              ref={(node) => {
                buttonsRef.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group relative flex flex-col items-center justify-center py-2.5 px-2 sm:px-3 rounded-lg text-center text-xs font-medium transition-all duration-200 select-none cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
                isSelected
                  ? "text-white font-semibold shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId={`reading-pill-${pillId}`}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 32 }
                  }
                  className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/20 shadow-md backdrop-blur-md"
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5 mb-0.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isSelected ? "text-indigo-300" : "text-white/40 group-hover:text-white/70"
                  )}
                />
                <span className="font-semibold text-xs tracking-tight text-white">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors hidden sm:inline-block",
                    isSelected
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/5 text-white/40 border border-white/5"
                  )}
                >
                  {item.badge}
                </span>
              </div>

              <span
                className={cn(
                  "relative z-10 text-[10px] leading-tight transition-colors line-clamp-1",
                  isSelected ? "text-white/80" : "text-white/40"
                )}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
