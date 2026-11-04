import { describe, expect, it } from "vitest";
import { applicantComplete, mergeVoters, summariseRound } from "./tally";
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

const ballot = (voterId: string, memberId: string | null, partial: Partial<Ballot>): Ballot => ({
  voterId,
  name: memberId ? `typed ${memberId}` : `Stranger ${voterId}`,
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

const names = (list: { name: string }[]) => list.map((r) => r.name);

describe("summariseRound", () => {
  const applicants = [applicant("ab", 2), applicant("cd", 1)];
  const ballots = [
    ballot("d1", "m1", { votes: { "ab-1": "yes", "ab-2": "no", "cd-1": "yes" }, feedback: { ab: "Strong colour" } }),
    ballot("d2", "m2", { votes: { "ab-1": "yes", "ab-2": "yes" }, feedback: { cd: "  " } }),
    // Attending: any votes are ignored, but feedback is still shown.
    ballot("d3", "m3", { attending: true, votes: { "ab-1": "no" }, feedback: { ab: "Will discuss" } }),
    // A name that matched nobody.
    ballot("d9", null, { votes: { "ab-1": "no" } }),
  ];
  const summary = summariseRound(applicants, ballots, members);

  it("groups committee members by response, and lists unmatched names separately", () => {
    expect(names(summary.responses.started)).toEqual(["Alex", "Bea"]);
    expect(names(summary.responses.attending)).toEqual(["Cal"]);
    expect(names(summary.responses.notYet)).toEqual(["Dee"]);
    expect(summary.responses.unlisted).toEqual([
      { name: "Stranger d9", updatedAt: "2026-11-03T10:00:00Z", ballotIds: ["d9"], status: "part-way" },
    ]);
  });

  it("counts remote votes per artwork, including unmatched names", () => {
    expect(summary.applicants[0].artworks).toEqual([
      { artworkId: "ab-1", yes: 2, no: 1 },
      { artworkId: "ab-2", yes: 1, no: 1 },
    ]);
  });

  it("works out the overall Yes percentage", () => {
    expect(summary.applicants[0].yesPercent).toBe(60);
    expect(summary.applicants[1].yesPercent).toBe(100);
  });

  it("collects non-empty feedback with names, attendees included", () => {
    expect(summary.applicants[0].feedback).toEqual([
      { voterName: "Alex", attending: false, text: "Strong colour" },
      { voterName: "Cal", attending: true, text: "Will discuss" },
    ]);
  });

  it("counts a member as complete once every applicant has votes and feedback", () => {
    const done = ballot("d1", "m1", { votes: { "ab-1": "yes", "ab-2": "no", "cd-1": "yes" }, feedback: { ab: "x", cd: "y" } });
    expect(names(summariseRound(applicants, [done], members).responses.complete)).toEqual(["Alex"]);
  });

  it("treats someone who only typed their name as not started", () => {
    const s = summariseRound(applicants, [ballot("d5", "m4", { attending: null })], members);
    expect(names(s.responses.notYet)).toEqual(["Alex", "Bea", "Cal", "Dee"]);
    expect(s.responses.notYet.find((r) => r.name === "Dee")?.ballotIds).toEqual(["d5"]);
  });
});

describe("mergeVoters", () => {
  it("combines one member's ballots from two devices, later answers winning", () => {
    const voters = mergeVoters(
      [
        ballot("phone", "m1", { votes: { a: "yes", b: "yes" }, feedback: { x: "first" }, updatedAt: "2026-11-03T09:00:00Z" }),
        ballot("ipad", "m1", { votes: { b: "no" }, feedback: { x: "second" }, updatedAt: "2026-11-03T11:00:00Z" }),
      ],
      members,
    );
    expect(voters).toHaveLength(1);
    expect(voters[0]).toMatchObject({
      memberId: "m1",
      name: "Alex",
      votes: { a: "yes", b: "no" },
      feedback: { x: "second" },
      ballotIds: ["phone", "ipad"],
    });
  });

  it("treats a member removed from the list as unmatched", () => {
    expect(mergeVoters([ballot("d1", "gone", {})], members)[0].memberId).toBeNull();
  });
});

describe("applicantComplete", () => {
  const a = applicant("ab", 3, 3); // third photo missing
  const answers = (partial: Partial<Ballot>) => ballot("d", "m1", partial);

  it("needs a vote on every pictured artwork and feedback", () => {
    expect(applicantComplete(a, answers({ votes: { "ab-1": "yes", "ab-2": "no" } }))).toBe(false);
    expect(applicantComplete(a, answers({ votes: { "ab-1": "yes", "ab-2": "no" }, feedback: { ab: "Good" } }))).toBe(true);
  });

  it("is complete for attendees, incomplete before the attending question or with no ballot", () => {
    expect(applicantComplete(a, answers({ attending: true }))).toBe(true);
    expect(applicantComplete(a, answers({ attending: null }))).toBe(false);
    expect(applicantComplete(a, undefined)).toBe(false);
  });
});
