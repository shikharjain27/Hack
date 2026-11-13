"use client";
import { useMemo } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from "d3-force";
import type { ConceptEdge, ConceptNode } from "@/lib/types";

type N = ConceptNode & SimulationNodeDatum;
const W = 640;
const H = 420;

export default function ConceptMap({
  nodes, edges, onSelect, selectedLabel,
}: { nodes: ConceptNode[]; edges: ConceptEdge[]; onSelect: (label: string) => void; selectedLabel: string | null }) {
  const layout = useMemo(() => {
    const ns: N[] = nodes.map((n) => ({ ...n }));
    const ids = new Set(ns.map((n) => n.id));
    const links = edges.filter((e) => ids.has(e.from) && ids.has(e.to)).map((e) => ({ ...e, source: e.from, target: e.to }));
    const sim = forceSimulation(ns)
      .force("link", forceLink<N, (typeof links)[number]>(links).id((d) => d.id).distance(130))
      .force("charge", forceManyBody().strength(-500))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide(45))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    const pos = new Map(ns.map((n) => [n.id, { x: Math.min(W - 50, Math.max(50, n.x ?? 0)), y: Math.min(H - 20, Math.max(20, n.y ?? 0)) }]));
    return { ns, links, pos };
  }, [nodes, edges]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-zinc-200 bg-white">
      {layout.links.map((l, i) => {
        const a = layout.pos.get(l.from)!;
        const b = layout.pos.get(l.to)!;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#a1a1aa" strokeWidth="1.5" />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} fontSize="10" fill="#71717a" textAnchor="middle">{l.label}</text>
          </g>
        );
      })}
      {layout.ns.map((n) => {
        const p = layout.pos.get(n.id)!;
        const sel = selectedLabel?.toLowerCase() === n.label.toLowerCase();
        return (
          <g key={n.id} onClick={() => onSelect(n.label)} className="cursor-pointer">
            <ellipse cx={p.x} cy={p.y} rx={Math.max(36, n.label.length * 3.6)} ry="17" fill={sel ? "#4f46e5" : "#eef2ff"} stroke="#4f46e5" />
            <text x={p.x} y={p.y + 4} fontSize="11" textAnchor="middle" fill={sel ? "#fff" : "#312e81"}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
