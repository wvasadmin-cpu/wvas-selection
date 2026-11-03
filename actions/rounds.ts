"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { applicantsForRound } from "@/lib/applicants";
import { diffCorrection, type ApplicantEdits } from "@/lib/corrections";
import { publishRound } from "@/lib/publish";
import { cleanPasscode, type RoundStatus } from "@/lib/rounds";
import { findPublishedRound, getCorrections, getRound, saveCorrections, saveRound } from "@/lib/store";

export type ActionState = { ok: boolean; message: string } | null;

const previewPath = (round: string) => `/admin/rounds/${encodeURIComponent(round)}`;

function problem(e: unknown): ActionState {
  if (e instanceof AirtableError) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: "Something went wrong. Please try again." };
}

export async function saveCorrectionsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const round = String(formData.get("round") ?? "");
  const applicantId = String(formData.get("applicantId") ?? "");
  try {
    const entry = applicantsForRound(await fetchApplicationRecords(), round).find((e) => e.applicant.id === applicantId);
    if (!entry) return { ok: false, message: "That applicant is no longer in this round in Airtable." };

    const base = entry.applicant;
    const edits: ApplicantEdits = {
      excluded: formData.get("excluded") === "on",
      bio: String(formData.get("bio") ?? ""),
      qualifications: String(formData.get("qualifications") ?? ""),
      otherMembership: String(formData.get("otherMembership") ?? ""),
      artworks: Object.fromEntries(
        base.artworks.map((a) => [
          a.id,
          { title: String(formData.get(`title:${a.id}`) ?? ""), medium: String(formData.get(`medium:${a.id}`) ?? "") },
        ]),
      ),
    };

    const corrections = await getCorrections(round);
    const correction = diffCorrection(base, edits);
    if (correction) corrections[applicantId] = correction;
    else delete corrections[applicantId];
    await saveCorrections(round, corrections);
    revalidatePath(previewPath(round));

    const published = await findPublishedRound(round);
    return {
      ok: true,
      message: published ? "Saved. Click Refresh from Airtable for judges to see the change." : "Saved.",
    };
  } catch (e) {
    return problem(e);
  }
}

export async function publishAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const round = String(formData.get("round") ?? "");
  try {
    if (await findPublishedRound(round)) return { ok: false, message: "This round is already published." };
    const { round: published, photoProblems } = await publishRound(round, {
      passcode: cleanPasscode(String(formData.get("passcode") ?? "")),
    });
    revalidatePath(previewPath(round));
    revalidatePath("/admin");
    return {
      ok: photoProblems === 0,
      message:
        `Published ${published.applicantCount} applicants.` +
        (photoProblems ? ` ${photoProblems} photo(s) couldn't be copied; try Refresh from Airtable.` : ""),
    };
  } catch (e) {
    return problem(e);
  }
}

export async function refreshAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const round = String(formData.get("round") ?? "");
  try {
    const existing = await findPublishedRound(round);
    if (!existing) return { ok: false, message: "This round hasn't been published yet." };
    const { round: refreshed, photoProblems } = await publishRound(round, { existingId: existing.id });
    revalidatePath(previewPath(round));
    revalidatePath("/admin");
    return {
      ok: photoProblems === 0,
      message:
        `Refreshed: ${refreshed.applicantCount} applicants. Votes already made are kept.` +
        (photoProblems ? ` ${photoProblems} photo(s) couldn't be copied.` : ""),
    };
  } catch (e) {
    return problem(e);
  }
}

export async function setStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const round = await getRound(String(formData.get("roundId") ?? ""));
  const status = String(formData.get("status")) as RoundStatus;
  if (!round || (status !== "open" && status !== "closed")) return;
  await saveRound({ ...round, status });
  revalidatePath(previewPath(round.name));
  revalidatePath("/admin");
}

export async function setPasscodeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const round = await getRound(String(formData.get("roundId") ?? ""));
  if (!round) return { ok: false, message: "Round not found." };
  const passcode = cleanPasscode(String(formData.get("passcode") ?? ""));
  await saveRound({ ...round, passcode });
  revalidatePath(previewPath(round.name));
  return {
    ok: true,
    message: passcode ? "Passcode saved. Anyone who already entered the old one will be asked again." : "Passcode removed.",
  };
}
