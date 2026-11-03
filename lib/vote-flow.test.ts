import { describe, expect, it } from "vitest";
import { cleanFeedback, firstIncomplete, newBallot, progressOf, whatsMissing } from "./vote-flow";
import type { Applicant, Ballot } from "./types";

const applicant = (id: string, missingPhoto?: number): Applicant => ({
  id,
  initials: id.toUpperCase(),
  fullName: "",
  bio: "",
  qualifications: "",
  otherMembership: "",
  artworks: [1, 2, 3].map((slot) => ({
    id: `${id}-${slot}`,
    slot,
    title: `W${slot}`,
    medium: "",
    mediumGuessed: false,
    hasImage: slot !== missingPhoto,
  })),
});

const applicants = [applicant("ab"), applicant("cd", 3)];

const ballot = (partial: Partial<Ballot>): Ballot => ({ ...newBallot("m1", false, "t"), ...partial });

describe("progress", () => {
  it("counts applicants with every pictured artwork voted and feedback given", () => {
    const b = ballot({ votes: { "ab-1": "yes", "ab-2": "no", "ab-3": "yes", "cd-1": "no", "cd-2": "no" }, feedback: { ab: "Good" } });
    expect(progressOf(applicants, b)).toEqual({ done: 1, total: 2 });
    expect(firstIncomplete(applicants, b)).toBe(1);
  });

  it("is complete straight away for attendees", () => {
    expect(firstIncomplete(applicants, ballot({ attending: true }))).toBe(-1);
  });

  it("starts at the first applicant with no ballot", () => {
    expect(firstIncomplete(applicants, undefined)).toBe(0);
  });
});

describe("whatsMissing", () => {
  it("lists votes and feedback still needed", () => {
    expect(whatsMissing(applicants[0], ballot({ votes: { "ab-1": "yes" } }))).toEqual([
      "a Yes or No for 2 more artworks",
      "your feedback",
    ]);
  });

  it("ignores artworks without a photo", () => {
    expect(whatsMissing(applicants[1], ballot({ votes: { "cd-1": "yes", "cd-2": "no" }, feedback: { cd: "Fine" } }))).toEqual([]);
  });
});

describe("cleanFeedback", () => {
  it("trims and limits length", () => {
    expect(cleanFeedback("  Nice work \r\n")).toBe("Nice work");
    expect(cleanFeedback("x".repeat(3000))).toHaveLength(2000);
  });
});
