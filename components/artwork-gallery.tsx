"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MAX_SCALE, panBy, RESET, zoomAt, type View } from "@/lib/zoom";

export type GalleryItem = {
  id: string;
  /** Full-size photo address (for viewing and zooming), or null when the photo hasn't arrived yet. */
  src: string | null;
  /** Small version for the grid; falls back to `src`. */
  thumb?: string | null;
  title: string;
  medium: string;
  /** Shown under the thumbnail (e.g. title, medium, admin notes, voting buttons). */
  caption: ReactNode;
};

type Gesture = {
  pointers: Map<number, { x: number; y: number }>;
  startX: number;
  startY: number;
  startView: View;
  /** Two fingers were involved at some point: never a swipe. */
  multi: boolean;
  moved: boolean;
  /** Where the press started: the photo, or the dark background around it. */
  startedOn: "photo" | "background";
  pinchDist: number;
  pinchMid: { x: number; y: number };
};

const ZOOM_STEP = 1.6;

// A grid of artwork photos. Clicking one opens it full screen, where you can
// zoom in to examine detail (+/-, double-click or double-tap, mouse wheel or
// trackpad, pinch) and drag to move around; arrows, arrow keys and swipe move
// between photos; Esc or ✕ closes.
export default function ArtworkGallery({ items }: { items: GalleryItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [view, setView] = useState<View>(RESET);
  const viewRef = useRef(view);
  viewRef.current = view;
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  // Decided when a press ends (the click that follows is aimed at the viewer,
  // which has taken over the pointer, so its target can't be trusted).
  const closeOnClick = useRef(false);

  const viewable = items.map((item, i) => ({ item, i })).filter(({ item }) => item.src);
  const position = viewable.findIndex(({ i }) => i === openIndex);
  const current = openIndex === null ? null : items[openIndex];
  const zoomed = view.scale > 1.01;

  // Each photo starts un-zoomed.
  useEffect(() => setView(RESET), [openIndex]);

  const open = (index: number) => {
    setOpenIndex(index);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = (delta: number) => {
    if (position === -1 || viewable.length < 2) return;
    setOpenIndex(viewable[(position + delta + viewable.length) % viewable.length].i);
  };

  /** Stage and photo sizes, and a screen point relative to the stage centre. */
  const measure = (clientX?: number, clientY?: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!rect || !img) return null;
    return {
      stage: { width: rect.width, height: rect.height },
      photo: { width: img.offsetWidth, height: img.offsetHeight },
      px: clientX === undefined ? 0 : clientX - (rect.left + rect.width / 2),
      py: clientY === undefined ? 0 : clientY - (rect.top + rect.height / 2),
    };
  };

  const zoomTo = (scale: number, clientX?: number, clientY?: number) => {
    const m = measure(clientX, clientY);
    if (m) setView((v) => zoomAt(v, scale, m.px, m.py, m.photo, m.stage));
  };

  const toggleZoom = (clientX: number, clientY: number) => zoomTo(zoomed ? 1 : 2.5, clientX, clientY);

  // Keyboard: arrows move between photos; + and - zoom; 0 resets.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "+" || e.key === "=") zoomTo(viewRef.current.scale * ZOOM_STEP);
      else if (e.key === "-") zoomTo(viewRef.current.scale / ZOOM_STEP);
      else if (e.key === "0") setView(RESET);
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  });

  // Mouse wheel and trackpad zoom around the pointer. Added directly so the
  // page itself doesn't zoom or scroll.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
      const m = measure(e.clientX, e.clientY);
      if (m) setView((v) => zoomAt(v, v.scale * factor, m.px, m.py, m.photo, m.stage));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [openIndex]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // let the arrows work normally
    e.currentTarget.setPointerCapture(e.pointerId);
    const g =
      gesture.current ??
      ({
        pointers: new Map(),
        startX: e.clientX,
        startY: e.clientY,
        startView: viewRef.current,
        multi: false,
        moved: false,
        startedOn: e.target === imgRef.current ? "photo" : "background",
        pinchDist: 0,
        pinchMid: { x: 0, y: 0 },
      } as Gesture);
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      g.multi = true;
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      g.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      g.startView = viewRef.current;
    }
    gesture.current = g;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || !g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size >= 2) {
      // Pinch: zoom around the starting midpoint and follow the fingers.
      const [a, b] = [...g.pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const m = measure(g.pinchMid.x, g.pinchMid.y);
      if (!m) return;
      const scale = g.startView.scale * ((Math.hypot(a.x - b.x, a.y - b.y) || 1) / g.pinchDist);
      const zoomedView = zoomAt(g.startView, scale, m.px, m.py, m.photo, m.stage);
      setView(panBy(zoomedView, mid.x - g.pinchMid.x, mid.y - g.pinchMid.y, m.photo, m.stage));
      g.moved = true;
      return;
    }
    if (g.multi) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
    if (g.startView.scale > 1.01) {
      const m = measure();
      if (m) setView(panBy(g.startView, dx, dy, m.photo, m.stage));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size > 0) return; // wait until every finger is lifted
    gesture.current = null;
    // A plain click on the background (not after dragging, not while zoomed) closes the viewer.
    closeOnClick.current = !g.moved && !g.multi && g.startedOn === "background" && viewRef.current.scale <= 1.01;
    if (e.type === "pointercancel") return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    // A quick sideways swipe on an un-zoomed photo moves to the next one.
    if (!g.multi && g.moved && g.startView.scale <= 1.01 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1);
      return;
    }
    // Double-tap or double-click on the photo toggles zoom at that spot.
    if (!g.moved && !g.multi && g.startedOn === "photo") {
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < 350 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 30) {
        lastTap.current = null;
        toggleZoom(e.clientX, e.clientY);
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  };

  const percent = Math.round(view.scale * 100);
  const controlBtn = "btn btn-sm btn-circle bg-black/60 border-white/30 text-white text-lg disabled:opacity-40";

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
                <img src={item.thumb ?? item.src} alt={item.title} loading="lazy" className="w-full h-full object-contain" />
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
        aria-label={current ? `${current.title}, enlarged` : "Enlarged photo"}
        className="m-0 h-dvh w-screen max-h-none max-w-none bg-black/95 p-0 backdrop:bg-black/80"
      >
        {current?.src && (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-2" role="group" aria-label="Zoom">
                <button type="button" className={controlBtn} aria-label="Zoom out" disabled={!zoomed}
                  onClick={() => zoomTo(view.scale / ZOOM_STEP)}>
                  −
                </button>
                <span className="text-white text-sm tabular-nums w-12 text-center" aria-live="polite">
                  {percent}%
                </span>
                <button type="button" className={controlBtn} aria-label="Zoom in" disabled={view.scale >= MAX_SCALE - 0.01}
                  onClick={() => zoomTo(view.scale * ZOOM_STEP)}>
                  +
                </button>
                {zoomed && (
                  <button type="button" className="btn btn-sm bg-black/60 border-white/30 text-white" onClick={() => setView(RESET)}>
                    Reset
                  </button>
                )}
              </div>
              <button type="button" onClick={close} className="btn btn-circle btn-ghost text-white text-xl" aria-label="Close">
                ✕
              </button>
            </div>
            <div
              ref={stageRef}
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-16 touch-none select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={() => {
                if (closeOnClick.current) close();
                closeOnClick.current = false;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={current.src}
                alt={current.title}
                draggable={false}
                className={`max-h-full max-w-full object-contain ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                style={{
                  transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                  transformOrigin: "center center",
                  // Smooth for buttons and double-tap; instant while dragging or pinching.
                  transition: gesture.current ? "none" : "transform 0.12s ease-out",
                }}
              />
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
            <div className="p-4 text-center text-white">
              <p className="font-semibold">{current.title}</p>
              <p className="text-sm text-white/80">
                {current.medium}
                {viewable.length > 1 && ` · ${position + 1} of ${viewable.length}`}
              </p>
              <p className="text-xs text-white/50 mt-1 hidden sm:block">
                Double-click or scroll to zoom · drag to move around
              </p>
              <p className="text-xs text-white/50 mt-1 sm:hidden">Double-tap or pinch to zoom · drag to move around</p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
