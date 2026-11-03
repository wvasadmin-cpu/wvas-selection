"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { voterCookieName, voterCookieValue } from "@/lib/access";
import { passcodeMatches } from "@/lib/rounds";
import { getBallot, getCommittee, getRound, saveBallot } from "@/lib/store";
import { cleanFeedback, newBallot } from "@/lib/vote-flow";
import { COOKIE_OPTIONS, memberCookieName, requireVoter } from "@/lib/voter";
import type { Vote } from "@/lib/types";

export type VoteFormState = { ok: boolean; message: string; confirmName?: string } | null;

const votePath = (roundId: string) => `/vote/${roundId}`;

export async function enterPasscodeAction(_prev: VoteFormState, formData: FormData): Promise<VoteFormState> {
  const round = await getRound(String(formData.get("roundId") ?? ""));
  if (!round) return { ok: false, message: "This link isn't recognised." };
  if (!passcodeMatches(round.passcode, String(formData.get("passcode") ?? ""))) {
    return { ok: false, message: "That passcode isn't right. It's in the email with the link." };
  }
  (await cookies()).set(voterCookieName(round.id), voterCookieValue(round), COOKIE_OPTIONS);
  revalidatePath(votePath(round.id));
  return { ok: true, message: "" };
}

export async function chooseMemberAction(_prev: VoteFormState, formData: FormData): Promise<VoteFormState> {
  const roundId = String(formData.get("roundId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const confirmed = formData.get("confirmed") === "yes";

  const round = await getRound(roundId);
  if (!round) return { ok: false, message: "This link isn't recognised." };
  const member = (await getCommittee()).find((m) => m.id === memberId);
  if (!member) return { ok: false, message: "Please choose your name from the list." };

  // Guard against picking someone else's name by mistake.
  if (!confirmed && (await getBallot(roundId, memberId))) {
    return { ok: false, message: "", confirmName: member.name };
  }

  (await cookies()).set(memberCookieName(roundId), member.id, COOKIE_OPTIONS);
  revalidatePath(votePath(roundId));
  return { ok: true, message: "" };
}

export async function forgetMemberAction(formData: FormData): Promise<void> {
  const roundId = String(formData.get("roundId") ?? "");
  (await cookies()).delete(memberCookieName(roundId));
  revalidatePath(votePath(roundId));
}

export async function setAttendingAction(formData: FormData): Promise<void> {
  const roundId = String(formData.get("roundId") ?? "");
  const attending = formData.get("attending") === "yes";
  const { member, ballot } = await requireVoter(roundId);
  await saveBallot(
    roundId,
    ballot ? { ...ballot, attending, updatedAt: new Date().toISOString() } : newBallot(member.id, attending),
  );
  revalidatePath(votePath(roundId));
}

export async function castVoteAction(roundId: string, artworkId: string, vote: Vote): Promise<{ ok: boolean; message?: string }> {
  try {
    const { round, member, ballot } = await requireVoter(roundId);
    if (vote !== "yes" && vote !== "no") return { ok: false, message: "Unknown vote." };
    const known = round.applicants.some((a) => a.artworks.some((art) => art.id === artworkId && art.hasImage));
    if (!known) return { ok: false, message: "That artwork isn't in this round." };
    const current = ballot ?? newBallot(member.id, false);
    await saveBallot(roundId, {
      ...current,
      votes: { ...current.votes, [artworkId]: vote },
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Your vote wasn't saved. Please try again." };
  }
}

export async function saveFeedbackAction(roundId: string, applicantId: string, text: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const { round, member, ballot } = await requireVoter(roundId);
    if (!round.applicants.some((a) => a.id === applicantId)) return { ok: false, message: "That applicant isn't in this round." };
    const current = ballot ?? newBallot(member.id, false);
    const feedback = { ...current.feedback };
    const clean = cleanFeedback(text);
    if (clean) feedback[applicantId] = clean;
    else delete feedback[applicantId];
    await saveBallot(roundId, { ...current, feedback, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Your feedback wasn't saved. Please try again." };
  }
}
