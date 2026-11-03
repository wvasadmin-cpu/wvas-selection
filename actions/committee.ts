"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { addMember, parsePastedNames, removeMember, renameMember } from "@/lib/committee";
import { getCommittee, saveCommittee } from "@/lib/store";

export type CommitteeFormState = { message: string; ok: boolean } | null;

export async function addMembersAction(_prev: CommitteeFormState, formData: FormData): Promise<CommitteeFormState> {
  await requireAdmin();
  const pasted = parsePastedNames(String(formData.get("names") ?? ""));
  if (pasted.length === 0) return { ok: false, message: "Please enter at least one name." };

  let members = await getCommittee();
  const added: string[] = [];
  const skipped: string[] = [];
  for (const { name, sourceId } of pasted) {
    const id = sourceId ? `id-${sourceId}` : randomUUID();
    const result = addMember(members, name, id);
    if (result.ok) {
      members = result.members;
      added.push(name);
    } else {
      skipped.push(`${name} (${result.error.replace(/\.$/, "").toLowerCase()})`);
    }
  }
  if (added.length) await saveCommittee(members);
  revalidatePath("/admin/committee");

  const parts = [];
  if (added.length) parts.push(`Added ${added.length} ${added.length === 1 ? "name" : "names"}.`);
  if (skipped.length) parts.push(`Skipped: ${skipped.join("; ")}.`);
  return { ok: added.length > 0, message: parts.join(" ") };
}

export async function renameMemberAction(_prev: CommitteeFormState, formData: FormData): Promise<CommitteeFormState> {
  await requireAdmin();
  const result = renameMember(await getCommittee(), String(formData.get("id")), String(formData.get("name") ?? ""));
  if (!result.ok) return { ok: false, message: result.error };
  await saveCommittee(result.members);
  revalidatePath("/admin/committee");
  return { ok: true, message: "Saved." };
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const result = removeMember(await getCommittee(), String(formData.get("id")));
  if (result.ok) await saveCommittee(result.members);
  revalidatePath("/admin/committee");
}
