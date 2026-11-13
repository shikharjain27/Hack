"use client";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Type } from "lucide-react";

export default function KaraokePlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [active, setActive] = useState(-1);
  const [lexend, setLexend] = useState(false);

  // word spans with their start offsets in the text
  const words = useMemo(() => {
    const out: { w: string; start: number }[] = [];
    for (const m of text.matchAll(/\S+/g)) out.push({ w: m[0], start: m.index ?? 0 });
    return out;
  }, [text]);

  useEffect(() => {
    return () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
  }, []);
  function speak() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (playing) { synth.cancel(); setPlaying(false); setActive(-1); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.onboundary = (e) => {
      const i = words.findIndex((w) => e.charIndex >= w.start && e.charIndex < w.start + w.w.length + 1);
      if (i >= 0) setActive(i);
    };
    u.onend = () => { setPlaying(false); setActive(-1); };
    u.onerror = () => { setPlaying(false); setActive(-1); };
    synth.cancel();
    synth.speak(u);
    setPlaying(true);
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <button onClick={speak} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? "Stop" : "Listen"}
        </button>
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="rounded border border-zinc-300 px-2 py-1 text-sm" aria-label="Speed">
          {[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}x</option>)}
        </select>
        <button onClick={() => setLexend(!lexend)} className={`flex items-center gap-1 rounded border px-2 py-1 text-sm ${lexend ? "border-indigo-600 text-indigo-700" : "border-zinc-300"}`}>
          <Type size={14} /> Dyslexia-friendly font
        </button>
      </div>
      <p className="leading-loose" style={lexend ? { fontFamily: "var(--font-lexend), sans-serif" } : undefined}>
        {words.map((w, i) => (
          <span key={i} className={i === active ? "rounded bg-yellow-300" : ""}>{w.w} </span>
        ))}
      </p>
    </div>
  );
}
