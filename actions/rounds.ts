"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { applicantsForRound } from "@/lib/applicants";
import { diffCorrection, type ApplicantEdits } from "@/lib/corrections";
import { publishStep } from "@/lib/publish";
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

export type StepState = {
  ok: boolean;
  message: string;
  /** Photos still to copy: the page runs another step while this is above 0. */
  remaining: number;
  photosReady: number;
  photosTotal: number;
};

function stepFail(message: string): StepState {
  return { ok: false, message, remaining: 0, photosReady: 0, photosTotal: 0 };
}

function stepProblem(e: unknown): StepState {
  return stepFail(problem(e)!.message);
}

/** First step of publishing a round (creates it and its link); later steps use refreshStepAction. */
export async function publishStepAction(round: string, passcode: string): Promise<StepState> {
  await requireAdmin();
  try {
    if (await findPublishedRound(round)) return stepFail("This round is already published.");
    const step = await publishStep(round, { passcode: cleanPasscode(passcode) });
    revalidatePath(previewPath(round));
    revalidatePath("/admin");
    return stepResult(step);
  } catch (e) {
    return stepProblem(e);
  }
}

/** One step of refreshing a published round from Airtable. Votes are kept. */
export async function refreshStepAction(round: string): Promise<StepState> {
  await requireAdmin();
  try {
    const existing = await findPublishedRound(round);
    if (!existing) return stepFail("This round hasn't been published yet.");
    const step = await publishStep(round, { existingId: existing.id });
    revalidatePath(previewPath(round));
    revalidatePath("/admin");
    return stepResult(step);
  } catch (e) {
    return stepProblem(e);
  }
}

function stepResult(step: Awaited<ReturnType<typeof publishStep>>): StepState {
  const { remaining, photosReady, photosTotal, photoProblems } = step;
  const base = { remaining, photosReady, photosTotal };
  if (remaining > 0) return { ok: true, message: `Copying photos… ${photosReady} of ${photosTotal}`, ...base };
  return {
    ok: photoProblems === 0,
    message:
      `All done: ${step.round.applicantCount} applicants, ${photosReady} of ${photosTotal} photos ready. Votes already made are kept.` +
      (photoProblems ? ` ${photoProblems} photo(s) couldn't be copied; click Refresh from Airtable to try again.` : ""),
    ...base,
  };
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
