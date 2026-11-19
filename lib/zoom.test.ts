import { describe, expect, it } from "vitest";
import { clampView, panBy, RESET, zoomAt } from "./zoom";

const stage = { width: 1000, height: 800 };
const photo = { width: 800, height: 800 }; // as drawn at 1x, fitted to the stage

describe("zoomAt", () => {
  it("zooming on the centre keeps the photo centred", () => {
    expect(zoomAt(RESET, 2, 0, 0, photo, stage)).toEqual({ scale: 2, x: 0, y: 0 });
  });

  it("keeps the point under the pointer in place", () => {
    // Pointer 200px right of centre: that spot of the photo should stay under it.
    const v = zoomAt(RESET, 2, 200, 0, photo, stage);
    expect(v).toEqual({ scale: 2, x: -200, y: 0 });
    // Photo point at 200 (1x) -> drawn at x + 200 * 2 = 200: unchanged on screen.
    expect(v.x + 200 * v.scale).toBe(200);
  });

  it("stays between 1x and 4x", () => {
    expect(zoomAt(RESET, 10, 0, 0, photo, stage).scale).toBe(4);
    expect(zoomAt({ scale: 2, x: 100, y: 0 }, 0.2, 0, 0, photo, stage)).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("panning", () => {
  it("can't move past the photo's edges", () => {
    // At 2x the photo is 1600 x 1600 on a 1000 x 800 stage: up to 300 sideways, 400 up/down.
    expect(panBy({ scale: 2, x: 0, y: 0 }, 1000, -1000, photo, stage)).toEqual({ scale: 2, x: 300, y: -400 });
  });

  it("doesn't move at all when not zoomed", () => {
    expect(panBy(RESET, 50, 50, photo, stage)).toEqual(RESET);
    expect(clampView({ scale: 1, x: 30, y: -30 }, photo, stage)).toEqual(RESET);
  });
});
