import { describe, expect, it } from "vitest";
import { applyCorrection, diffCorrection, isExcluded, type ApplicantEdits } from "./corrections";
import type { Applicant } from "./types";

const base: Applicant = {
  id: "recA",
  initials: "RE",
  fullName: "Rosa Example",
  bio: "Paints landscapes.",
  qualifications: "BA Fine Art",
  otherMembership: "",
  artworks: [
    { id: "recA-1", slot: 1, title: "Untitled", medium: "Media, acrylic", mediumGuessed: true, hasImage: true },
    { id: "recA-2", slot: 2, title: "Hill Farm", medium: "Oil", mediumGuessed: false, hasImage: true },
  ],
};

const unchanged = (): ApplicantEdits => ({
  excluded: false,
  bio: base.bio,
  qualifications: base.qualifications,
  otherMembership: base.otherMembership,
  artworks: Object.fromEntries(base.artworks.map((a) => [a.id, { title: a.title, medium: a.medium }])),
});

describe("diffCorrection", () => {
  it("stores nothing when nothing changed (ignoring spaces at the ends)", () => {
    const edits = unchanged();
    edits.bio = "  Paints landscapes.\r\n";
    expect(diffCorrection(base, edits)).toBeNull();
  });

  it("stores only the changed fields", () => {
    const edits = unchanged();
    edits.artworks["recA-1"].medium = "Mixed media, acrylic";
    edits.qualifications = "BA (Hons) Fine Art";
    expect(diffCorrection(base, edits)).toEqual({
      qualifications: "BA (Hons) Fine Art",
      artworks: { "recA-1": { medium: "Mixed media, acrylic" } },
    });
  });

  it("ignores a blanked-out title rather than losing it", () => {
    const edits = unchanged();
    edits.artworks["recA-2"].title = "  ";
    expect(diffCorrection(base, edits)).toBeNull();
  });

  it("records leaving an applicant out", () => {
    expect(diffCorrection(base, { ...unchanged(), excluded: true })).toEqual({ excluded: true });
  });
});

describe("applyCorrection", () => {
  it("returns the applicant unchanged without a correction", () => {
    expect(applyCorrection(base, undefined)).toBe(base);
  });

  it("lays corrections over the Airtable values", () => {
    const result = applyCorrection(base, {
      bio: "Shorter bio.",
      artworks: { "recA-1": { title: "Dawn", medium: "Mixed media" } },
    });
    expect(result.bio).toBe("Shorter bio.");
    expect(result.qualifications).toBe("BA Fine Art");
    expect(result.artworks[0]).toEqual({ ...base.artworks[0], title: "Dawn", medium: "Mixed media", mediumGuessed: false });
    expect(result.artworks[1]).toBe(base.artworks[1]);
  });

  it("knows when an applicant is left out", () => {
    expect(isExcluded({ excluded: true })).toBe(true);
    expect(isExcluded(undefined)).toBe(false);
  });
});
