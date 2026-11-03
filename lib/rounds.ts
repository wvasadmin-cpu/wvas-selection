// Published judging rounds. A round is a snapshot of the applicants (with
// corrections applied) plus its status. Its id is long and random, and forms
// the voting link, so it can't be guessed.

import type { Applicant } from "./types";

export type RoundStatus = "open" | "closed";

export type RoundSummary = {
  id: string;
  name: string;
  status: RoundStatus;
  /** Optional word committee members enter before voting. */
  passcode: string;
  publishedAt: string;
  refreshedAt: string;
  applicantCount: number;
};

export type Round = RoundSummary & { applicants: Applicant[] };

/** Storage-safe key for a round name: "March 27" -> "march-27". */
export function roundKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "round";
}

export function cleanPasscode(passcode: string): string {
  return (passcode ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
}

/** Passcodes are compared ignoring case and spaces at the ends. */
export function passcodeMatches(expected: string, given: string): boolean {
  const want = cleanPasscode(expected).toLowerCase();
  return want === "" || want === cleanPasscode(given).toLowerCase();
}

export function summaryOf(round: Round): RoundSummary {
  const { applicants, ...summary } = round;
  return { ...summary, applicantCount: applicants.length };
}
