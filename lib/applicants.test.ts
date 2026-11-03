import { describe, expect, it } from "vitest";
import { applicantsForRound, countRounds, isIncomplete, roundOf, type AirtableRecord } from "./applicants";

const photo = (name: string) => [{ url: `https://example.com/${name}`, filename: name }];

// Made-up applicants shaped like real Airtable records.
const records: AirtableRecord[] = [
  {
    id: "recA",
    fields: {
      "First Name": "Rosa",
      Surname: "Example",
      "Previous Experience": "Paints landscapes.",
      "Date of Submission": "March 27",
      "Artwork 1": "No title.  Acrylic on board",
      "Image 1": photo("a1.jpg"),
      "Artwork 2": "Hill Farm",
      "Medium 2": "OIL ON CANVAS",
      "Image 2": photo("a2.jpg"),
      "Artwork 3": "no title Watercolour",
    },
  },
  { id: "recB", fields: { "First Name": "Jon", Surname: "Tbc", "Previous Experience": "tbc", "Date of Submission": "March 27" } },
  {
    id: "recC",
    fields: { "First Name": "Ray", Surname: "Bloggs", "Date of Submission": "march  27", "Artwork 1": "Sea, Oil", "Image 1": photo("c1.jpg") },
  },
  { id: "recD", fields: { "First Name": "Old", Surname: "Entry", "Date of Submission": { name: "Sept 26" }, "Artwork 1": "X" } },
];

describe("roundOf", () => {
  it("reads text and single-select values", () => {
    expect(roundOf(records[0])).toBe("March 27");
    expect(roundOf(records[3])).toBe("Sept 26");
  });
});

describe("applicantsForRound", () => {
  const round = applicantsForRound(records, "March 27");

  it("matches the round ignoring case and spacing", () => {
    expect(round.map((a) => a.applicant.id)).toEqual(["recA", "recB", "recC"]);
  });

  it("builds artworks with tidy titles, media and numbered untitled works", () => {
    expect(round[0].applicant.artworks).toEqual([
      { id: "recA-1", slot: 1, title: "Untitled 1", medium: "Acrylic on board", mediumGuessed: true, hasImage: true },
      { id: "recA-2", slot: 2, title: "Hill Farm", medium: "Oil on canvas", mediumGuessed: false, hasImage: true },
      { id: "recA-3", slot: 3, title: "Untitled 2", medium: "Watercolour", mediumGuessed: true, hasImage: false },
    ]);
  });

  it("keeps image sources separately, by artwork", () => {
    expect(round[0].images).toEqual([
      { artworkId: "recA-1", url: "https://example.com/a1.jpg", filename: "a1.jpg" },
      { artworkId: "recA-2", url: "https://example.com/a2.jpg", filename: "a2.jpg" },
    ]);
  });

  it("gives initials and full names", () => {
    expect(round.map((a) => a.applicant.initials)).toEqual(["RE", "JT", "RB"]);
    expect(round[0].applicant.fullName).toBe("Rosa Example");
  });

  it("flags applicants with no artworks", () => {
    expect(round.map((a) => isIncomplete(a.applicant))).toEqual([false, true, false]);
  });
});

describe("countRounds", () => {
  it("summarises each round without personal details", () => {
    expect(countRounds(records)).toEqual([
      { round: "March 27", applicants: 3, incomplete: 1, artworks: 4, photos: 3, mediaGuessed: 3 },
      { round: "Sept 26", applicants: 1, incomplete: 0, artworks: 1, photos: 0, mediaGuessed: 1 },
    ]);
  });
});
