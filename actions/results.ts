"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { deleteBallot } from "@/lib/store";

/** Remove one person's votes and feedback for a round (e.g. a test run), from every device they used. */
export async function clearBallotAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const ids = String(formData.get("ballotIds") ?? "").split(",").filter(Boolean);
  if (!roundId || ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteBallot(roundId, id)));
  revalidatePath(`/admin/results/${roundId}`);
}
