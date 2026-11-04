"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { voterCookieName, voterCookieValue } from "@/lib/access";
import { cleanTypedName, displayName, matchMember } from "@/lib/name-match";
import { passcodeMatches } from "@/lib/rounds";
import { getBallot, getCommittee, getRound, saveBallot } from "@/lib/store";
import { cleanFeedback, newBallot } from "@/lib/vote-flow";
import { COOKIE_OPTIONS, DEVICE_COOKIE, requireVoter } from "@/lib/voter";
import type { Vote } from "@/lib/types";

export type VoteFormState = { ok: boolean; message: string } | null;

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

export async function enterNameAction(_prev: VoteFormState, formData: FormData): Promise<VoteFormState> {
  const roundId = String(formData.get("roundId") ?? "");
  const round = await getRound(roundId);
  if (!round) return { ok: false, message: "This link isn't recognised." };
  if (round.status !== "open") return { ok: false, message: "This round has closed." };

  const typed = cleanTypedName(String(formData.get("first") ?? ""), String(formData.get("surname") ?? ""));
  if (!typed.first || !typed.surname) return { ok: false, message: "Please enter your first name and surname." };

  // Only committee members may vote: refuse names that don't match the list.
  const members = await getCommittee();
  if (members.length === 0) {
    return { ok: false, message: "The committee list hasn't been set up yet. Please contact the Membership Secretary." };
  }
  const member = matchMember(typed, members);
  if (!member) {
    return {
      ok: false,
      message: `We couldn't find ${displayName(typed)} on the committee list. Please check the spelling, or contact the Membership Secretary.`,
    };
  }

  const jar = await cookies();
  let deviceId = jar.get(DEVICE_COOKIE)?.value;
  if (!deviceId) {
    deviceId = randomBytes(18).toString("base64url");
    jar.set(DEVICE_COOKIE, deviceId, COOKIE_OPTIONS);
  }

  const existing = await getBallot(roundId, deviceId);
  const name = displayName(typed);
  await saveBallot(
    roundId,
    existing
      ? { ...existing, name, memberId: member.id, updatedAt: new Date().toISOString() }
      : newBallot(deviceId, name, member.id),
  );
  revalidatePath(votePath(roundId));
  return { ok: true, message: "" };
}

/** "Not you?": start afresh on this device as someone else (e.g. a shared iPad). */
export async function startOverAction(formData: FormData): Promise<void> {
  const roundId = String(formData.get("roundId") ?? "");
  (await cookies()).delete(DEVICE_COOKIE);
  revalidatePath(votePath(roundId));
}

export async function setAttendingAction(formData: FormData): Promise<void> {
  const roundId = String(formData.get("roundId") ?? "");
  const attending = formData.get("attending") === "yes";
  const { ballot } = await requireVoter(roundId);
  await saveBallot(roundId, { ...ballot, attending, updatedAt: new Date().toISOString() });
  revalidatePath(votePath(roundId));
}

export async function castVoteAction(roundId: string, artworkId: string, vote: Vote): Promise<{ ok: boolean; message?: string }> {
  try {
    const { round, ballot } = await requireVoter(roundId);
    if (vote !== "yes" && vote !== "no") return { ok: false, message: "Unknown vote." };
    const known = round.applicants.some((a) => a.artworks.some((art) => art.id === artworkId && art.hasImage));
    if (!known) return { ok: false, message: "That artwork isn't in this round." };
    await saveBallot(roundId, { ...ballot, votes: { ...ballot.votes, [artworkId]: vote }, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Your vote wasn't saved. Please try again." };
  }
}

export async function saveFeedbackAction(roundId: string, applicantId: string, text: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const { round, ballot } = await requireVoter(roundId);
    if (!round.applicants.some((a) => a.id === applicantId)) return { ok: false, message: "That applicant isn't in this round." };
    const feedback = { ...ballot.feedback };
    const clean = cleanFeedback(text);
    if (clean) feedback[applicantId] = clean;
    else delete feedback[applicantId];
    await saveBallot(roundId, { ...ballot, feedback, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Your feedback wasn't saved. Please try again." };
  }
}
