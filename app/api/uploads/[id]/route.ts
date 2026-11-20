import sharp from "sharp";
import { getUpload } from "@/lib/store";

// Serves an uploaded application photo so Airtable can collect it (and, with
// ?size=thumb, a small version for the acknowledgement email). The id is long
// and random, so photos can't be found by guessing.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const photo = await getUpload(id);
  if (!photo) return new Response("Not found", { status: 404 });

  const thumb = new URL(req.url).searchParams.get("size") === "thumb";
  const body = thumb
    ? await sharp(Buffer.from(photo)).resize({ width: 300, height: 300, fit: "inside" }).jpeg({ quality: 78 }).toBuffer()
    : photo;
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}
