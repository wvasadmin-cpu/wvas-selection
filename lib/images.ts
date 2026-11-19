import "server-only";
import sharp from "sharp";

// Photos are downloaded from Airtable (whose links expire) and stored twice:
// a large copy with enough detail to zoom into, and a small thumbnail so grids
// and lists load quickly on a phone.
const LARGE_EDGE = 3500;
const THUMB_EDGE = 480;

export type StoredPhoto = { large: Buffer; thumb: Buffer };

export async function downloadAndResize(url: string): Promise<StoredPhoto> {
  // A photo that takes too long is given up on (and retried next refresh)
  // rather than holding up everything else.
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`Photo download failed (${res.status}).`);
  const input = sharp(Buffer.from(await res.arrayBuffer()), { limitInputPixels: 150_000_000 }).rotate(); // respect the camera's orientation
  const [large, thumb] = await Promise.all([
    input
      .clone()
      .resize({ width: LARGE_EDGE, height: LARGE_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer(),
    input
      .clone()
      .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 76, mozjpeg: true })
      .toBuffer(),
  ]);
  return { large, thumb };
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
    .resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
