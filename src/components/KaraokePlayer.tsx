"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Type, Loader2, Volume2 } from "lucide-react";

const VOICES: [string, string][] = [
  ["Kore", "Kore (warm)"], ["Puck", "Puck (upbeat)"], ["Charon", "Charon (calm)"],
  ["Aoede", "Aoede (bright)"], ["Fenrir", "Fenrir (steady)"],
];

export default function KaraokePlayer({ text, lang }: { text: string; lang?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const [rate, setRate] = useState(1);
  const [voice, setVoice] = useState("Kore");
  const [active, setActive] = useState(-1);
  const [lexend, setLexend] = useState(false);
  const [engine, setEngine] = useState<"gemini" | "browser" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const raf = useRef<number | null>(null);
  const cache = useRef(new Map<string, string>()); // voice+text -> blob url

  const words = useMemo(() => {
    const out: { w: string; start: number }[] = [];
    for (const m of text.matchAll(/\S+/g)) out.push({ w: m[0], start: m.index ?? 0 });
    return out;
  }, [text]);

  function stop() {
    if (raf.current) cancelAnimationFrame(raf.current);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setActive(-1);
  }

  useEffect(() => {
    const urls = cache.current;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  function speakWithBrowser() {
    const synth = window.speechSynthesis;
    if (!synth) { setStatus("idle"); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    if (lang) u.lang = lang;
    u.onboundary = (e) => {
      const i = words.findIndex((w) => e.charIndex >= w.start && e.charIndex < w.start + w.w.length + 1);
      if (i >= 0) setActive(i);
    };
    u.onend = u.onerror = () => { setStatus("idle"); setActive(-1); };
    synth.cancel();
    synth.speak(u);
    setEngine("browser");
    setStatus("playing");
  }

  async function play() {
    if (status !== "idle") { stop(); return; }
    setStatus("loading");
    const key = `${voice}|${text}`;
    try {
      let url = cache.current.get(key);
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        });
        if (!res.ok) throw new Error("tts failed");
        url = URL.createObjectURL(await res.blob());
        cache.current.set(key, url);
      }
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      audio.onended = () => { if (raf.current) cancelAnimationFrame(raf.current); setStatus("idle"); setActive(-1); };
      const tick = () => {
        if (audio.duration > 0) {
          // map playback position to a character position to highlight the word being spoken
          const pos = (audio.currentTime / audio.duration) * text.length;
          let i = 0;
          while (i + 1 < words.length && words[i + 1].start <= pos) i++;
          setActive(i);
        }
        raf.current = requestAnimationFrame(tick);
      };
      await audio.play();
      setEngine("gemini");
      setStatus("playing");
      raf.current = requestAnimationFrame(tick);
    } catch {
      speakWithBrowser(); // Gemini voice unavailable: fall back to the browser's built-in voice
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={play} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
          {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : status === "playing" ? <Pause size={16} /> : <Play size={16} />}
          {status === "loading" ? "Preparing voice…" : status === "playing" ? "Stop" : "Listen"}
        </button>
        <select value={voice} onChange={(e) => { stop(); setVoice(e.target.value); }} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" aria-label="Voice">
          {VOICES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" aria-label="Speed">
          {[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}x</option>)}
        </select>
        <button onClick={() => setLexend(!lexend)} className={`btn-ghost flex items-center gap-1 px-2.5 py-1.5 text-sm ${lexend ? "!border-indigo-500 text-indigo-700" : ""}`}>
          <Type size={14} /> Dyslexia-friendly font
        </button>
        {engine && status !== "idle" && (
          <span className="flex items-center gap-1 text-xs text-zinc-400"><Volume2 size={12} /> {engine === "gemini" ? "Gemini voice" : "browser voice"}</span>
        )}
      </div>
      <p className="leading-loose" style={lexend ? { fontFamily: "var(--font-lexend), sans-serif" } : undefined}>
        {words.map((w, i) => (
          <span key={i} className={i === active ? "rounded bg-yellow-300" : ""}>{w.w} </span>
        ))}
      </p>
    </div>
  );
}
