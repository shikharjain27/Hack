"use client";

import { useMemo, useState, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import { ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";
import type { ConceptEdge, ConceptNode } from "@/lib/types";

type N = ConceptNode & SimulationNodeDatum;
const W = 680;
const H = 440;

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

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
          .distance(135),
      )
      .force("charge", forceManyBody().strength(-520))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide(48))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    const pos = new Map(
      ns.map((n) => [
        n.id,
        {
          x: Math.min(W - 60, Math.max(60, n.x ?? 0)),
          y: Math.min(H - 30, Math.max(30, n.y ?? 0)),
        },
      ]),
    );
    return { ns, links, pos };
  }, [nodes, edges]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "circle" || (e.target as HTMLElement).tagName === "text") {
      return;
    }
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.5, Number((z + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-xl overflow-hidden space-y-3 relative">
      {/* Top Header & Floating Pan/Zoom Controls */}
      <div className="flex items-center justify-between px-1 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/80">Interactive Concept Graph</span>
          <span>·</span>
          <span>Click any node to cross-highlight in glossary</span>
        </div>

        {/* Floating Zoom & Pan Toolbar */}
        <div className="flex items-center gap-1.5 liquid-glass p-1 rounded-xl border border-white/10 z-20">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <span className="text-[10px] font-mono font-semibold text-white/70 px-1 select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={resetView}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset pan and zoom"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Interactive Pan/Zoom SVG Canvas */}
      <div
        className={`w-full h-[420px] bg-black/40 rounded-2xl overflow-hidden relative border border-white/5 ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="activeNodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edges */}
          {layout.links.map((l, i) => {
            const a = layout.pos.get(l.from)!;
            const b = layout.pos.get(l.to)!;
            const isRelated =
              selectedLabel &&
              (layout.ns.find((n) => n.id === l.from)?.label === selectedLabel ||
                layout.ns.find((n) => n.id === l.to)?.label === selectedLabel);

            return (
              <g key={i}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isRelated ? "#818cf8" : "rgba(255, 255, 255, 0.2)"}
                  strokeWidth={isRelated ? "2" : "1.5"}
                  strokeDasharray="4 2"
                />
                <rect
                  x={(a.x + b.x) / 2 - 30}
                  y={(a.y + b.y) / 2 - 9}
                  width="60"
                  height="18"
                  rx="5"
                  fill="rgba(9, 9, 11, 0.9)"
                  stroke="rgba(255, 255, 255, 0.1)"
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 + 3.5}
                  fontSize="9"
                  fill={isRelated ? "#c7d2fe" : "rgba(255, 255, 255, 0.65)"}
                  textAnchor="middle"
                  className="select-none font-medium"
                >
                  {l.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {layout.ns.map((n) => {
            const p = layout.pos.get(n.id)!;
            const isSelected = selectedLabel === n.label;

            return (
              <g
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(n.label);
                }}
                className="cursor-pointer group"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? "34" : "28"}
                  fill={isSelected ? "url(#activeNodeGlow)" : "url(#nodeGlow)"}
                  className="transition-all duration-200"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? "22" : "18"}
                  fill={isSelected ? "#4f46e5" : "#18181b"}
                  stroke={isSelected ? "#a5b4fc" : "#818cf8"}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  className="transition-all duration-200 group-hover:stroke-white"
                />
                <text
                  x={p.x}
                  y={p.y + 30}
                  fontSize="11"
                  fill={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.85)"}
                  fontWeight={isSelected ? "700" : "500"}
                  textAnchor="middle"
                  className="select-none transition-all drop-shadow-md"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Drag Hint */}
        <div className="absolute bottom-2.5 left-3 text-[10px] text-white/40 flex items-center gap-1 pointer-events-none select-none">
          <Move size={10} />
          <span>Click & drag to pan · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
