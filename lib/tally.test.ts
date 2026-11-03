import { describe, expect, it } from "vitest";
import { applicantComplete, summariseRound } from "./tally";
import type { Applicant, Ballot } from "./types";

const applicant = (id: string, slots: number, missingPhoto?: number): Applicant => ({
  id,
  initials: id.toUpperCase(),
  fullName: `Applicant ${id}`,
  bio: "",
  qualifications: "",
  otherMembership: "",
  artworks: Array.from({ length: slots }, (_, i) => ({
    id: `${id}-${i + 1}`,
    slot: i + 1,
    title: `Work ${i + 1}`,
    medium: "Oil",
    mediumGuessed: false,
    hasImage: i + 1 !== missingPhoto,
  })),
});

const ballot = (memberId: string, partial: Partial<Ballot>): Ballot => ({
  memberId,
  attending: false,
  votes: {},
  feedback: {},
  updatedAt: "2026-11-03T10:00:00Z",
  ...partial,
});

const members = [
  { id: "m1", name: "Alex" },
  { id: "m2", name: "Bea" },
  { id: "m3", name: "Cal" },
  { id: "m4", name: "Dee" },
];

describe("summariseRound", () => {
  const applicants = [applicant("ab", 2), applicant("cd", 1)];
  const ballots = [
    ballot("m1", { votes: { "ab-1": "yes", "ab-2": "no", "cd-1": "yes" }, feedback: { ab: "Strong colour" } }),
    ballot("m2", { votes: { "ab-1": "yes", "ab-2": "yes" }, feedback: { cd: "  " } }),
    // Attending: any votes are ignored, but feedback is still shown.
    ballot("m3", { attending: true, votes: { "ab-1": "no" }, feedback: { ab: "Will discuss" } }),
  ];

  const summary = summariseRound(applicants, ballots, members);

  it("groups members by response", () => {
    expect(summary.responses).toEqual({ voted: ["Alex", "Bea"], attending: ["Cal"], notYet: ["Dee"] });
  });

  it("counts remote votes per artwork", () => {
    expect(summary.applicants[0].artworks).toEqual([
      { artworkId: "ab-1", yes: 2, no: 0 },
      { artworkId: "ab-2", yes: 1, no: 1 },
    ]);
  });

  it("works out the overall Yes percentage", () => {
    expect(summary.applicants[0].yesPercent).toBe(75);
    expect(summary.applicants[1].yesPercent).toBe(100);
  });

  it("collects non-empty feedback with names, attendees included", () => {
    expect(summary.applicants[0].feedback).toEqual([
      { memberName: "Alex", attending: false, text: "Strong colour" },
      { memberName: "Cal", attending: true, text: "Will discuss" },
    ]);
    expect(summary.applicants[1].feedback).toEqual([]);
  });

  it("gives null before any votes", () => {
    expect(summariseRound(applicants, [], members).applicants[0].yesPercent).toBeNull();
  });

  it("names ballots from people no longer on the list", () => {
    const s = summariseRound(applicants, [ballot("gone", { feedback: { ab: "Hi" } })], members);
    expect(s.applicants[0].feedback[0].memberName).toBe("Former committee member");
  });
});

describe("applicantComplete", () => {
  const a = applicant("ab", 3, 3); // third photo missing

  it("needs a vote on every pictured artwork and feedback", () => {
    expect(applicantComplete(a, ballot("m1", { votes: { "ab-1": "yes", "ab-2": "no" } }))).toBe(false);
    expect(applicantComplete(a, ballot("m1", { votes: { "ab-1": "yes", "ab-2": "no" }, feedback: { ab: "Good" } }))).toBe(true);
  });

  it("is complete for attendees and incomplete with no ballot", () => {
    expect(applicantComplete(a, ballot("m1", { attending: true }))).toBe(true);
    expect(applicantComplete(a, undefined)).toBe(false);
  });
});
