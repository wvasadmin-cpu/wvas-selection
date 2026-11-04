// Turning ballots into the dashboard summary.
//
// Ballots are stored per device. Ballots whose typed name matched the same
// committee member are merged (later answers win), so switching device part
// way through loses nothing. Names that matched nobody are kept separate.

import type { CommitteeMember } from "./committee";
import type { Answers, Applicant, Ballot } from "./types";

export type ArtworkTally = { artworkId: string; yes: number; no: number };

export type FeedbackEntry = { voterName: string; attending: boolean; text: string };

export type ApplicantSummary = {
  applicantId: string;
  artworks: ArtworkTally[];
  /** Share of Yes votes across all this applicant's artworks, 0–100, or null before any votes. */
  yesPercent: number | null;
  feedback: FeedbackEntry[];
};

/** One person's combined answers. */
export type Voter = Answers & {
  memberId: string | null;
  name: string;
  updatedAt: string;
  /** Device ids of the ballots combined here (used to clear them). */
  ballotIds: string[];
};

export type Responder = { name: string; updatedAt: string | null; ballotIds: string[] };

export type RoundResults = {
  responses: {
    /** Voted on every applicant, with feedback. */
    complete: Responder[];
    /** Started but not finished. */
    started: Responder[];
    attending: Responder[];
    /** On the committee list but nothing yet. */
    notYet: Responder[];
    /** Typed a name that didn't match the committee list. */
    unlisted: (Responder & { status: string })[];
  };
  voters: Voter[];
  applicants: ApplicantSummary[];
};

export function mergeVoters(ballots: Ballot[], members: CommitteeMember[]): Voter[] {
  const groups = new Map<string, Ballot[]>();
  for (const ballot of ballots) {
    const member = ballot.memberId && members.some((m) => m.id === ballot.memberId) ? ballot.memberId : null;
    const key = member ? `member:${member}` : `device:${ballot.voterId}`;
    groups.set(key, [...(groups.get(key) ?? []), { ...ballot, memberId: member }]);
  }
  return [...groups.values()].map((group) => {
    const ordered = [...group].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const latest = ordered.at(-1)!;
    const memberName = members.find((m) => m.id === latest.memberId)?.name;
    return {
      memberId: latest.memberId,
      name: memberName ?? latest.name,
      attending: latest.attending,
      votes: Object.assign({}, ...ordered.map((b) => b.votes)),
      feedback: Object.assign({}, ...ordered.map((b) => b.feedback)),
      updatedAt: latest.updatedAt,
      ballotIds: ordered.map((b) => b.voterId),
    };
  });
}

function hasAnswers(a: Answers): boolean {
  return Object.keys(a.votes).length > 0 || Object.values(a.feedback).some((t) => t.trim() !== "");
}

/**
 * What a remote voter still has to do for one applicant: vote on every artwork
 * that has a photo, and leave feedback (required unless attending).
 */
export function applicantComplete(applicant: Applicant, answers: Answers | undefined | null): boolean {
  if (!answers) return false;
  if (answers.attending === true) return true;
  if (answers.attending === null) return false;
  const allVoted = applicant.artworks.filter((a) => a.hasImage).every((a) => answers.votes[a.id] !== undefined);
  return allVoted && (answers.feedback[applicant.id] ?? "").trim() !== "";
}

function statusOf(voter: Voter, applicants: Applicant[]): "attending" | "complete" | "started" | "notYet" {
  if (voter.attending === true) return "attending";
  if (voter.attending === false && applicants.every((a) => applicantComplete(a, voter))) return "complete";
  return hasAnswers(voter) || voter.attending === false ? "started" : "notYet";
}

const STATUS_WORDS = { attending: "attending", complete: "voted online", started: "part-way", notYet: "not started" };

export function summariseRound(applicants: Applicant[], ballots: Ballot[], members: CommitteeMember[]): RoundResults {
  const voters = mergeVoters(ballots, members);
  const responses: RoundResults["responses"] = { complete: [], started: [], attending: [], notYet: [], unlisted: [] };

  for (const member of members) {
    const voter = voters.find((v) => v.memberId === member.id);
    const who = { name: member.name, updatedAt: voter?.updatedAt ?? null, ballotIds: voter?.ballotIds ?? [] };
    responses[voter ? statusOf(voter, applicants) : "notYet"].push(who);
  }
  for (const voter of voters.filter((v) => !v.memberId)) {
    responses.unlisted.push({
      name: voter.name,
      updatedAt: voter.updatedAt,
      ballotIds: voter.ballotIds,
      status: STATUS_WORDS[statusOf(voter, applicants)],
    });
  }

  // Votes from people attending the meeting are not counted: they vote there.
  const remote = voters.filter((v) => v.attending !== true);

  const summaries = applicants.map((applicant): ApplicantSummary => {
    const artworks = applicant.artworks.map((artwork) => {
      let yes = 0;
      let no = 0;
      for (const voter of remote) {
        const vote = voter.votes[artwork.id];
        if (vote === "yes") yes++;
        else if (vote === "no") no++;
      }
      return { artworkId: artwork.id, yes, no };
    });
    const totalYes = artworks.reduce((sum, a) => sum + a.yes, 0);
    const totalVotes = artworks.reduce((sum, a) => sum + a.yes + a.no, 0);

    const feedback = voters
      .map((v) => ({ voterName: v.name, attending: v.attending === true, text: (v.feedback[applicant.id] ?? "").trim() }))
      .filter((entry) => entry.text !== "")
      .sort((a, b) => a.voterName.localeCompare(b.voterName, "en-GB"));

    return {
      applicantId: applicant.id,
      artworks,
      yesPercent: totalVotes === 0 ? null : Math.round((totalYes / totalVotes) * 100),
      feedback,
    };
  });

  return { responses, voters, applicants: summaries };
}
