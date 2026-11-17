import "server-only";
import sharp from "sharp";

// Photos are downloaded from Airtable (whose links expire) and stored as
// sensible-sized JPEGs: big enough to view full screen, small enough to load
// quickly on a phone.
const MAX_EDGE = 2000;

export async function downloadAndResize(url: string): Promise<Buffer> {
  // A photo that takes too long is given up on (and retried next refresh)
  // rather than holding up everything else.
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9_000) });
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

/** Check an uploaded file really is a photo and store it as a tidy JPEG (camera details such as location removed). */
export async function normaliseUpload(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
