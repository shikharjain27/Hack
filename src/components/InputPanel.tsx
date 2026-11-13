"use client";

import { useRef, useState } from "react";
import { Sparkles, FileText, ImageUp, X, FileCheck } from "lucide-react";
import { SAMPLE_TEXT } from "@/lib/sample";

export interface FileInput {
  base64: string;
  mimeType: string;
  preview: string;
  fileName?: string;
  isPdf?: boolean;
}

export default function InputPanel({
  text,
  setText,
  image,
  setImage,
  onSubmit,
  loading,
}: {
  text: string;
  setText: (t: string) => void;
  image: FileInput | null;
  setImage: (i: FileInput | null) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [thumbOk, setThumbOk] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(file: File | undefined) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const base64 = url.includes(",") ? url.split(",")[1] : url;
      setImage({
        base64,
        mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        preview: isPdf ? "" : url,
        fileName: file.name,
        isPdf,
      });
      setThumbOk(true);
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
    } catch {
      /* optional photo */
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={13} className="text-indigo-400" />
          Textbook Source Input
        </label>
        <span className="text-[11px] text-white/40">Markdown / PDF / Image</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a dense textbook paragraph, research abstract, or lecture notes… Or upload a PDF/image below."
        className="h-56 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          readFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-3.5 text-xs text-white/60 hover:bg-white/[0.04] hover:border-white/30 hover:text-white transition-all text-center"
      >
        <ImageUp size={16} className="text-indigo-400 flex-shrink-0" />
        <span>Drop PDF chapter or textbook photo, or click to upload</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          hidden
          onChange={(e) => readFile(e.target.files?.[0])}
        />
      </div>

      {image && (
        <div className="relative flex items-center justify-between p-3 rounded-xl border border-white/15 bg-white/[0.04]">
          {image.isPdf ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <FileCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate max-w-[200px]">
                  {image.fileName || "Uploaded document.pdf"}
                </p>
                <p className="text-[10px] text-white/40">PDF document ready for AI extraction</p>
              </div>
            </div>
          ) : thumbOk && image.preview ? (
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.preview}
                alt="Uploaded page"
                className="w-12 h-12 rounded-lg object-cover border border-white/20"
                onError={() => setThumbOk(false)}
              />
              <span className="text-xs text-white/70 truncate max-w-[180px]">
                {image.fileName || "Textbook scan"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-white/60">Image attached</span>
          )}

          <button
            onClick={() => setImage(null)}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={loadSample}
          type="button"
          className="liquid-glass rounded-xl flex-1 py-2.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5"
        >
          <Sparkles size={13} className="text-amber-400" />
          Load Krebs cycle sample
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || (!text.trim() && !image)}
          type="button"
          className="rounded-xl flex-1 bg-white py-2.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-white/10"
        >
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Unjargoning…</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Unjargon</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
