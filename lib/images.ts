import "server-only";
import sharp from "sharp";

// Photos are downloaded from Airtable (whose links expire) and stored as
// sensible-sized JPEGs: big enough to view full screen, small enough to load
// quickly on a phone.
const MAX_EDGE = 2000;

export async function downloadAndResize(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Photo download failed (${res.status}).`);
  const input = Buffer.from(await res.arrayBuffer());
  return sharp(input)
    .rotate() // respect the camera's orientation
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/** Run tasks a few at a time, so publishing is quick without overloading anything. */
export async function inBatches<T>(items: T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(task));
  }
}
