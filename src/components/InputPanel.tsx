"use client";
import { useRef, useState } from "react";
import { Sparkles, FileText, ImageUp, X } from "lucide-react";
import { SAMPLE_TEXT } from "@/lib/sample";

export interface ImageInput { base64: string; mimeType: string; preview: string }

export default function InputPanel({
  text, setText, image, setImage, onSubmit, loading,
}: {
  text: string; setText: (t: string) => void;
  image: ImageInput | null; setImage: (i: ImageInput | null) => void;
  onSubmit: () => void; loading: boolean;
}) {
  const [thumbOk, setThumbOk] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImage({ base64: url.split(",")[1], mimeType: file.type, preview: url });
    };
    reader.readAsDataURL(file);
  }

  async function loadSample() {
    setText(SAMPLE_TEXT);
    try {
      const res = await fetch("/sample/krebs.jpg");
      if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return;
      const blob = await res.blob();
      readFile(new File([blob], "krebs.jpg", { type: blob.type }));
    } catch { /* optional photo */ }
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a dense textbook paragraph…"
        className="h-56 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm"
      />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-3 text-sm text-zinc-500 hover:bg-zinc-100"
      >
        <ImageUp size={16} /> Drop a photo of a page, or click
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => readFile(e.target.files?.[0])} />
      </div>
      {image && thumbOk && (
        <div className="relative w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt="Uploaded page" className="rounded border" onError={() => setThumbOk(false)} />
          <button onClick={() => setImage(null)} aria-label="Remove image" className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-0.5 text-white">
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={loadSample} className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-100">
          <FileText size={16} /> Load Sample Input
        </button>
        <button onClick={onSubmit} disabled={loading || (!text.trim() && !image)} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          <Sparkles size={16} /> {loading ? "Working…" : "Unjargon it"}
        </button>
      </div>
    </div>
  );
}
