// Turning committee ballots into the dashboard summary.

import type { CommitteeMember } from "./committee";
import type { Applicant, Ballot } from "./types";

export type ArtworkTally = { artworkId: string; yes: number; no: number };

export type FeedbackEntry = { memberName: string; attending: boolean; text: string };

export type ApplicantSummary = {
  applicantId: string;
  artworks: ArtworkTally[];
  /** Share of Yes votes across all this applicant's artworks, 0–100, or null before any votes. */
  yesPercent: number | null;
  feedback: FeedbackEntry[];
};

export type RoundSummary = {
  responses: { voted: string[]; attending: string[]; notYet: string[] };
  applicants: ApplicantSummary[];
};

function hasAnswered(ballot: Ballot): boolean {
  return (
    Object.keys(ballot.votes).length > 0 ||
    Object.values(ballot.feedback).some((text) => text.trim() !== "")
  );
}

export function summariseRound(applicants: Applicant[], ballots: Ballot[], members: CommitteeMember[]): RoundSummary {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Former committee member";
  const byMember = new Map(ballots.map((b) => [b.memberId, b]));

  const voted: string[] = [];
  const attending: string[] = [];
  const notYet: string[] = [];
  for (const member of members) {
    const ballot = byMember.get(member.id);
    if (ballot?.attending) attending.push(member.name);
    else if (ballot && hasAnswered(ballot)) voted.push(member.name);
    else notYet.push(member.name);
  }

  // Votes from members marked as attending are not counted: they vote at the meeting.
  const remoteBallots = ballots.filter((b) => !b.attending);

  const summaries = applicants.map((applicant): ApplicantSummary => {
    const artworks = applicant.artworks.map((artwork) => {
      let yes = 0;
      let no = 0;
      for (const ballot of remoteBallots) {
        const vote = ballot.votes[artwork.id];
        if (vote === "yes") yes++;
        else if (vote === "no") no++;
      }
      return { artworkId: artwork.id, yes, no };
    });

    const totalYes = artworks.reduce((sum, a) => sum + a.yes, 0);
    const totalVotes = artworks.reduce((sum, a) => sum + a.yes + a.no, 0);

    const feedback = ballots
      .map((ballot) => ({
        memberName: nameOf(ballot.memberId),
        attending: ballot.attending,
        text: (ballot.feedback[applicant.id] ?? "").trim(),
      }))
      .filter((entry) => entry.text !== "")
      .sort((a, b) => a.memberName.localeCompare(b.memberName, "en-GB"));

    return {
      applicantId: applicant.id,
      artworks,
      yesPercent: totalVotes === 0 ? null : Math.round((totalYes / totalVotes) * 100),
      feedback,
    };
  });

  return { responses: { voted, attending, notYet }, applicants: summaries };
}

/**
 * What a remote voter still has to do for one applicant: vote on every artwork
 * that has a photo, and leave feedback (required unless attending).
 */
export function applicantComplete(applicant: Applicant, ballot: Ballot | undefined): boolean {
  if (!ballot) return false;
  if (ballot.attending) return true;
  const allVoted = applicant.artworks.filter((a) => a.hasImage).every((a) => ballot.votes[a.id] !== undefined);
  const hasFeedback = (ballot.feedback[applicant.id] ?? "").trim() !== "";
  return allVoted && hasFeedback;
}
