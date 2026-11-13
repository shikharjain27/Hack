"use client";

import { useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import type { ConceptEdge, ConceptNode } from "@/lib/types";

type N = ConceptNode & SimulationNodeDatum;
const W = 640;
const H = 420;

export default function ConceptMap({
  nodes,
  edges,
  onSelect,
  selectedLabel,
}: {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  onSelect: (label: string) => void;
  selectedLabel: string | null;
}) {
  const layout = useMemo(() => {
    const ns: N[] = nodes.map((n) => ({ ...n }));
    const ids = new Set(ns.map((n) => n.id));
    const links = edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e) => ({ ...e, source: e.from, target: e.to }));
    const sim = forceSimulation(ns)
      .force(
        "link",
        forceLink<N, (typeof links)[number]>(links)
          .id((d) => d.id)
          .distance(130),
      )
      .force("charge", forceManyBody().strength(-500))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide(45))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    const pos = new Map(
      ns.map((n) => [
        n.id,
        {
          x: Math.min(W - 50, Math.max(50, n.x ?? 0)),
          y: Math.min(H - 25, Math.max(25, n.y ?? 0)),
        },
      ]),
    );
    return { ns, links, pos };
  }, [nodes, edges]);

  return (
    <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-2 text-xs text-white/50">
        <span>Interactive Concept Graph · Click any node to highlight in glossary</span>
        <span className="font-mono text-[10px] text-indigo-400">{nodes.length} nodes · {edges.length} edges</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-black/40 rounded-xl">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {layout.links.map((l, i) => {
          const a = layout.pos.get(l.from)!;
          const b = layout.pos.get(l.to)!;
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <rect
                x={(a.x + b.x) / 2 - 28}
                y={(a.y + b.y) / 2 - 8}
                width="56"
                height="16"
                rx="4"
                fill="rgba(9, 9, 11, 0.85)"
              />
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 + 3}
                fontSize="9"
                fill="rgba(255, 255, 255, 0.6)"
                textAnchor="middle"
                className="font-medium"
              >
                {l.label}
              </text>
            </g>
          );
        })}

        {layout.ns.map((n) => {
          const p = layout.pos.get(n.id)!;
          const sel = selectedLabel?.toLowerCase() === n.label.toLowerCase();
          const rx = Math.max(38, n.label.length * 4);

          return (
            <g
              key={n.id}
              onClick={() => onSelect(n.label)}
              className="cursor-pointer transition-all hover:scale-105"
            >
              {sel && (
                <circle cx={p.x} cy={p.y} r={rx + 8} fill="url(#nodeGlow)" />
              )}
              <ellipse
                cx={p.x}
                cy={p.y}
                rx={rx}
                ry="18"
                fill={sel ? "#4f46e5" : "rgba(255, 255, 255, 0.05)"}
                stroke={sel ? "#a5b4fc" : "rgba(255, 255, 255, 0.3)"}
                strokeWidth={sel ? "2" : "1"}
              />
              <text
                x={p.x}
                y={p.y + 4}
                fontSize="11"
                textAnchor="middle"
                fill={sel ? "#ffffff" : "rgba(255, 255, 255, 0.9)"}
                className="font-medium select-none"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
