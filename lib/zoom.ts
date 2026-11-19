// Zoom and pan maths for the full-screen photo viewer. Positions are measured
// from the centre of the viewing area; the photo is drawn centred, then moved
// by (x, y) and scaled by `scale`.

export type View = { scale: number; x: number; y: number };
export type Size = { width: number; height: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const RESET: View = { scale: 1, x: 0, y: 0 };

/** Keep the photo covering the viewing area: no panning past its edges. */
export function clampView(view: View, photo: Size, stage: Size): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
  const maxX = Math.max(0, (photo.width * scale - stage.width) / 2);
  const maxY = Math.max(0, (photo.height * scale - stage.height) / 2);
  return {
    scale,
    // "+ 0" turns -0 into 0.
    x: Math.min(maxX, Math.max(-maxX, view.x)) + 0,
    y: Math.min(maxY, Math.max(-maxY, view.y)) + 0,
  };
}

/** Zoom to `scale`, keeping the point under (px, py) in the same place on screen. */
export function zoomAt(view: View, scale: number, px: number, py: number, photo: Size, stage: Size): View {
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  const ratio = next / view.scale;
  return clampView({ scale: next, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio }, photo, stage);
}

/** Move the zoomed photo by (dx, dy). */
export function panBy(view: View, dx: number, dy: number, photo: Size, stage: Size): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, photo, stage);
}
