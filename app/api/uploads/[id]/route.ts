import { getUpload } from "@/lib/store";

// Serves an uploaded application photo so Airtable can collect it. The id is
// long and random, so photos can't be found by guessing.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const photo = await getUpload(id);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
}
