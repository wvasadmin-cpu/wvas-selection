import { hasVoterAccess } from "@/lib/access";
import { getAdminEmail } from "@/lib/admin";
import { getImage, getRound } from "@/lib/store";

// Serves a round's resized photos, only to the admin or to voters with access.
export async function GET(_req: Request, { params }: { params: Promise<{ roundId: string; artworkId: string }> }) {
  const { roundId, artworkId } = await params;
  const round = await getRound(roundId);
  if (!round) return new Response("Not found", { status: 404 });

  if (!(await hasVoterAccess(round)) && !(await getAdminEmail())) {
    return new Response("Not allowed", { status: 403 });
  }

  const image = await getImage(roundId, artworkId);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(image, {
    headers: {
      "Content-Type": "image/jpeg",
      // Private: browsers may keep a copy for an hour, shared caches may not.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
