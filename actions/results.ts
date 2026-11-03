"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { deleteBallot, deleteClaim } from "@/lib/store";

/** Remove one member's votes and feedback for a round (e.g. a test run), and unlock their name. */
export async function clearBallotAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!roundId || !memberId) return;
  await Promise.all([deleteBallot(roundId, memberId), deleteClaim(roundId, memberId)]);
  revalidatePath(`/admin/results/${roundId}`);
}

/** Let a member carry on from a different device (their votes are kept). */
export async function unlockNameAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!roundId || !memberId) return;
  await deleteClaim(roundId, memberId);
  revalidatePath(`/admin/results/${roundId}`);
}
