import "server-only";
import { cookies } from "next/headers";
import { hasVoterAccess } from "./access";
import type { CommitteeMember } from "./committee";
import type { Round } from "./rounds";
import { getBallot, getCommittee, getRound } from "./store";
import type { Ballot } from "./types";

// Who is voting. The member's choice of name is remembered in a cookie on
// their device; this is a convenience, not a password (the passcode and the
// unguessable link keep outsiders out).

export const memberCookieName = (roundId: string) => `wvas-member-${roundId}`;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 120, // about four months
};

export type VoterContext = {
  round: Round;
  access: boolean;
  members: CommitteeMember[];
  member: CommitteeMember | null;
  ballot: Ballot | null;
};

export async function getVoterContext(roundId: string): Promise<VoterContext | null> {
  const round = await getRound(roundId);
  if (!round) return null;
  const access = await hasVoterAccess(round);
  if (!access) return { round, access, members: [], member: null, ballot: null };

  const members = await getCommittee();
  const memberId = (await cookies()).get(memberCookieName(roundId))?.value;
  const member = members.find((m) => m.id === memberId) ?? null;
  const ballot = member ? await getBallot(roundId, member.id) : null;
  return { round, access, members, member, ballot };
}

/** For voting actions: the round must be open and the voter identified. */
export async function requireVoter(roundId: string): Promise<{ round: Round; member: CommitteeMember; ballot: Ballot | null }> {
  const ctx = await getVoterContext(roundId);
  if (!ctx || !ctx.access) throw new Error("No access to this round.");
  if (ctx.round.status !== "open") throw new Error("This round has closed.");
  if (!ctx.member) throw new Error("Please choose your name first.");
  return { round: ctx.round, member: ctx.member, ballot: ctx.ballot };
}
