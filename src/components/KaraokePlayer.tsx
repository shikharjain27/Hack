"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Type, Loader2, Volume2 } from "lucide-react";

const VOICES: [string, string][] = [
  ["Kore", "Kore (warm)"],
  ["Puck", "Puck (upbeat)"],
  ["Charon", "Charon (calm)"],
  ["Aoede", "Aoede (bright)"],
  ["Fenrir", "Fenrir (steady)"],
];

export default function KaraokePlayer({
  text,
  lang,
  initialRate = 1,
  initialLexend = false,
}: {
  text: string;
  lang?: string;
  initialRate?: number;
  initialLexend?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const [rate, setRate] = useState(initialRate);
  const [voice, setVoice] = useState("Kore");
  const [active, setActive] = useState(-1);
  const [lexend, setLexend] = useState(initialLexend);
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  function speakWithBrowser() {
    const synth = window.speechSynthesis;
    if (!synth) {
      setStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    if (lang) u.lang = lang;
    u.onboundary = (e) => {
      if (e.name !== "word") return;
      let i = 0;
      while (i + 1 < words.length && words[i + 1].start <= e.charIndex) i++;
      setActive(i);
    };
    u.onend = () => {
      setStatus("idle");
      setActive(-1);
    };
    u.onerror = () => {
      setStatus("idle");
      setActive(-1);
    };
    setEngine("browser");
    setStatus("playing");
    synth.cancel();
    synth.speak(u);
  }

  async function play() {
    if (status === "playing") {
      stop();
      return;
    }
    stop();
    setStatus("loading");

    const key = `${voice}:${text}`;
    let url = cache.current.get(key);

    try {
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        });
        if (!res.ok) throw new Error("tts failed");
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cache.current.set(key, url);
      }

      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      audio.onended = () => {
        if (raf.current) cancelAnimationFrame(raf.current);
        setStatus("idle");
        setActive(-1);
      };
      const tick = () => {
        if (audio.duration > 0) {
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
      speakWithBrowser();
    }
  }

  return (
    <div className="liquid-glass rounded-2xl space-y-3.5 p-5 border border-white/10 shadow-lg">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={play}
          className="rounded-xl bg-white text-black font-semibold flex items-center gap-1.5 px-4 py-2 text-xs hover:bg-white/90 transition-all cursor-pointer shadow-md"
        >
          {status === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : status === "playing" ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}
          {status === "loading" ? "Preparing voice…" : status === "playing" ? "Pause" : "Listen (TTS)"}
        </button>

        <select
          value={voice}
          onChange={(e) => {
            stop();
            setVoice(e.target.value);
          }}
          className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-2.5 py-1.5 text-xs outline-none"
          aria-label="Voice"
        >
          {VOICES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-2.5 py-1.5 text-xs outline-none"
          aria-label="Speed"
        >
          {[0.75, 1, 1.25, 1.5].map((r) => (
            <option key={r} value={r}>
              {r}x Speed
            </option>
          ))}
        </select>

        <button
          onClick={() => setLexend(!lexend)}
          className={`liquid-glass rounded-xl flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
            lexend ? "text-indigo-300 border border-indigo-500/50" : "text-white/60 hover:text-white"
          }`}
        >
          <Type size={13} /> Dyslexia Font
        </button>

        {engine && status !== "idle" && (
          <span className="flex items-center gap-1 text-[11px] text-white/50 bg-white/5 px-2 py-1 rounded-md ml-auto">
            <Volume2 size={12} className="text-emerald-400" />
            {engine === "gemini" ? "Neural AI Voice" : "Browser Synthesizer"}
          </span>
        )}
      </div>

      <p
        className="leading-loose text-white/90 text-sm md:text-base pt-1"
        style={lexend ? { fontFamily: "var(--font-lexend), sans-serif", letterSpacing: "0.025em", lineHeight: "1.9" } : undefined}
      >
        {words.map((w, i) => (
          <span
            key={i}
            className={
              i === active
                ? "rounded bg-amber-300 text-black px-1.5 py-0.5 font-bold shadow-md transition-all"
                : ""
            }
          >
            {w.w}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
