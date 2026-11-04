import "server-only";
import { cookies } from "next/headers";
import { hasVoterAccess } from "./access";
import type { Round } from "./rounds";
import { getBallot, getRound } from "./store";
import type { Ballot } from "./types";

// Who is voting. Each browser gets a random device id (in a cookie) and its
// votes are stored under that id, labelled with the name typed in. Votes are
// only ever shown back to the device that made them, so typing someone
// else's name never reveals or changes their votes.

export const DEVICE_COOKIE = "wvas-device";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 400, // about 13 months
};

export type VoterContext = {
  round: Round;
  access: boolean;
  /** This device's ballot for the round, or null before they've given their name. */
  ballot: Ballot | null;
};

export async function getVoterContext(roundId: string): Promise<VoterContext | null> {
  const round = await getRound(roundId);
  if (!round) return null;
  const access = await hasVoterAccess(round);
  if (!access) return { round, access, ballot: null };
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  const ballot = deviceId ? await getBallot(roundId, deviceId) : null;
  return { round, access, ballot };
}

/** For voting actions: the round must be open and this device must have given a name. */
export async function requireVoter(roundId: string): Promise<{ round: Round; ballot: Ballot }> {
  const ctx = await getVoterContext(roundId);
  if (!ctx || !ctx.access) throw new Error("No access to this round.");
  if (ctx.round.status !== "open") throw new Error("This round has closed.");
  if (!ctx.ballot) throw new Error("Please enter your name first.");
  return { round: ctx.round, ballot: ctx.ballot };
}
