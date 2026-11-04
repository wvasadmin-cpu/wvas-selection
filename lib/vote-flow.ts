// Where a committee member is up to in a round.

import { applicantComplete } from "./tally";
import type { Answers, Applicant, Ballot } from "./types";

export type Progress = { done: number; total: number };

export function progressOf(applicants: Applicant[], ballot: Answers | undefined): Progress {
  return { done: applicants.filter((a) => applicantComplete(a, ballot)).length, total: applicants.length };
}

/** 0-based index of the first applicant still needing votes or feedback, or -1 when all done. */
export function firstIncomplete(applicants: Applicant[], ballot: Answers | undefined): number {
  return applicants.findIndex((a) => !applicantComplete(a, ballot));
}

/** What a remote voter still has to do for one applicant, in plain words (empty when complete). */
export function whatsMissing(applicant: Pick<Applicant, "id" | "artworks">, ballot: Answers | undefined): string[] {
  const missing: string[] = [];
  const unvoted = applicant.artworks.filter((a) => a.hasImage && !ballot?.votes[a.id]).length;
  if (unvoted > 0) missing.push(`a Yes or No for ${unvoted} more ${unvoted === 1 ? "artwork" : "artworks"}`);
  if (!(ballot?.feedback[applicant.id] ?? "").trim()) missing.push("your feedback");
  return missing;
}

/** A fresh ballot once someone has typed their name on a device. */
export function newBallot(
  voterId: string,
  name: string,
  memberId: string | null,
  now = new Date().toISOString(),
): Ballot {
  return { voterId, name, memberId, attending: null, votes: {}, feedback: {}, updatedAt: now };
}

export const FEEDBACK_MAX = 2000;

export function cleanFeedback(text: string): string {
  return (text ?? "").replace(/\r\n/g, "\n").trim().slice(0, FEEDBACK_MAX);
}
