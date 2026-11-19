"use client";

import { useRef, useState } from "react";

export type PhotoState = { id: string; preview: string } | null;

// Keep plenty of detail for judges to zoom into, while staying under Netlify's
// upload limit (about 6 MB per request).
const MAX_EDGE = 3600;
const MAX_BYTES = 4_500_000;

async function encode(bitmap: ImageBitmap, edge: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/** Shrink a photo in the browser only as much as needed, so big phone photos upload reliably. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      for (const [edge, quality] of [
        [MAX_EDGE, 0.9],
        [MAX_EDGE, 0.8],
        [3000, 0.8],
        [2400, 0.8],
      ] as const) {
        const blob = await encode(bitmap, edge, quality);
        if (blob && blob.size <= MAX_BYTES) return blob;
      }
    } finally {
      bitmap.close();
    }
  } catch {
    // Browser can't read it (e.g. some HEIC files): send as it is and let the server try.
  }
  return file;
}

export default function PhotoPicker({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: PhotoState;
  onChange: (photo: PhotoState) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProblem("");
    try {
      const body = new FormData();
      body.append("photo", await shrink(file), "photo.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? "The photo didn't upload. Please try again.");
      onChange({ id: json.id, preview: URL.createObjectURL(file) });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The photo didn't upload. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const message = problem || error;
  return (
    <div>
      <span id={`${id}-label`} className="block text-sm font-semibold mb-1">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-28 h-28 rounded bg-base-200 border border-base-300 flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.preview} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xs text-base-content/50 px-2 text-center">{busy ? "Uploading…" : "No photo yet"}</span>
          )}
        </div>
        <div className="space-y-1">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/*"
            aria-labelledby={`${id}-label`}
            aria-invalid={!!message}
            aria-describedby={message ? `${id}-error` : undefined}
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Uploading…" : value ? "Change photo" : "Choose photo"}
          </button>
          <p className="text-xs text-base-content/60">JPEG or PNG. Large photos are reduced automatically.</p>
        </div>
      </div>
      {message && (
        <p id={`${id}-error`} className="text-error text-sm mt-1">
          {message}
        </p>
      )}
    </div>
  );
}
