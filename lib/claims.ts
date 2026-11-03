// Each committee member's name is tied to the first device that uses it in a
// round, so nobody can view or change another member's votes by picking their
// name on a different phone or computer. The admin can unlock a name.

export type Claim = { deviceId: string; claimedAt: string };

export type ClaimDecision = "allow" | "confirm" | "blocked";

/**
 * Can this device use this name?
 * - Claimed by this device: allow.
 * - Claimed by another device: blocked.
 * - Unclaimed but already has votes (from before names were locked): ask
 *   "is this you?" first, then allow.
 * - Unclaimed with no votes: allow.
 */
export function decideClaim(claim: Claim | null, hasBallot: boolean, deviceId: string, confirmed: boolean): ClaimDecision {
  if (claim) return claim.deviceId === deviceId ? "allow" : "blocked";
  if (hasBallot && !confirmed) return "confirm";
  return "allow";
}

export function claimMatches(claim: Claim | null, deviceId: string | undefined): boolean {
  return !!claim && !!deviceId && claim.deviceId === deviceId;
}
