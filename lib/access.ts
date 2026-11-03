import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { RoundSummary } from "./rounds";

// Voter access to a round. With no passcode, the unguessable link is enough.
// With a passcode, entering it sets a cookie proving it was given; the cookie
// holds a signature, not the passcode, and stops working if it is changed.

export const voterCookieName = (roundId: string) => `wvas-round-${roundId}`;

function signature(round: Pick<RoundSummary, "id" | "passcode">): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return createHmac("sha256", secret).update(`${round.id}:${round.passcode.toLowerCase()}`).digest("base64url");
}

export function voterCookieValue(round: Pick<RoundSummary, "id" | "passcode">): string {
  return signature(round);
}

export async function hasVoterAccess(round: Pick<RoundSummary, "id" | "passcode">): Promise<boolean> {
  if (!round.passcode) return true;
  const given = (await cookies()).get(voterCookieName(round.id))?.value ?? "";
  const want = signature(round);
  return given.length === want.length && timingSafeEqual(Buffer.from(given), Buffer.from(want));
}
