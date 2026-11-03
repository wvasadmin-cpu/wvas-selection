"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { deleteBallot } from "@/lib/store";

/** Remove one member's votes and feedback for a round (e.g. a test run). */
export async function clearBallotAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!roundId || !memberId) return;
  await deleteBallot(roundId, memberId);
  revalidatePath(`/admin/results/${roundId}`);
}
