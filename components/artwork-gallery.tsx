"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type GalleryItem = {
  id: string;
  /** Photo address, or null when the photo hasn't arrived yet. */
  src: string | null;
  title: string;
  medium: string;
  /** Shown under the thumbnail (e.g. title, medium, admin notes, voting buttons). */
  caption: ReactNode;
};

// A grid of artwork photos; clicking one opens it full screen, with arrows,
// arrow keys and swipe to move between photos, and Esc or ✕ to close.
export default function ArtworkGallery({ items }: { items: GalleryItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Swipe tracking. A swipe is one finger moving sideways; anything that
  // involves two fingers (a pinch) is ignored, as is sliding while zoomed in.
  const swipe = useRef<{ x: number; y: number; multi: boolean } | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const viewable = items.map((item, i) => ({ item, i })).filter(({ item }) => item.src);
  const position = viewable.findIndex(({ i }) => i === openIndex);
  const current = openIndex === null ? null : items[openIndex];

  const open = (index: number) => {
    setOpenIndex(index);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = (delta: number) => {
    if (position === -1 || viewable.length < 2) return;
    const next = viewable[(position + delta + viewable.length) % viewable.length];
    setOpenIndex(next.i);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <ul className="grid gap-5 grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id}>
            {item.src ? (
              <button
                type="button"
                onClick={() => open(index)}
                className="block w-full aspect-square bg-base-200 rounded overflow-hidden cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Enlarge ${item.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.title} loading="lazy" className="w-full h-full object-contain" />
              </button>
            ) : (
              <div className="w-full aspect-square bg-base-200 rounded flex items-center justify-center">
                <span className="text-sm text-base-content/60">Image to follow</span>
              </div>
            )}
            <div className="mt-2">{item.caption}</div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenIndex(null)}
        onClick={(e) => {
          // A click on the dark background (not the photo or buttons) closes it.
          if (e.target === e.currentTarget) close();
        }}
        onTouchStart={(e) => {
          if (e.touches.length > 1) {
            if (swipe.current) swipe.current.multi = true;
            else swipe.current = { x: 0, y: 0, multi: true };
            return;
          }
          swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, multi: false };
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 1 && swipe.current) swipe.current.multi = true;
        }}
        onTouchEnd={(e) => {
          const start = swipe.current;
          if (!start || e.touches.length > 0) return; // wait until every finger is lifted
          swipe.current = null;
          const zoomed = (window.visualViewport?.scale ?? 1) > 1.05;
          if (start.multi || zoomed) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => (swipe.current = null)}
        aria-label={current ? `${current.title}, enlarged` : "Enlarged photo"}
        className="m-0 h-dvh w-screen max-h-none max-w-none bg-black/95 p-0 backdrop:bg-black/80"
      >
        {current?.src && (
          <div className="flex h-full w-full flex-col" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="flex justify-end p-3" onClick={(e) => e.target === e.currentTarget && close()}>
              <button type="button" onClick={close} className="btn btn-circle btn-ghost text-white text-xl" aria-label="Close">
                ✕
              </button>
            </div>
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
              onClick={(e) => e.target === e.currentTarget && close()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.src} alt={current.title} className="max-h-full max-w-full object-contain" />
              {viewable.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="btn btn-circle absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl"
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="btn btn-circle absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl"
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div className="p-4 text-center text-white" onClick={(e) => e.target === e.currentTarget && close()}>
              <p className="font-semibold">{current.title}</p>
              <p className="text-sm text-white/80">
                {current.medium}
                {viewable.length > 1 && ` · ${position + 1} of ${viewable.length}`}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
