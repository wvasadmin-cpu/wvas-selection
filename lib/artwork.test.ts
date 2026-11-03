import { describe, expect, it } from "vitest";
import { isUntitled, numberUntitled, splitTitleAndMedium, tidyMedium, tidyTitle } from "./artwork";

// Real examples of the combined "Artwork" box from past applications.
const cases: [string, string, string][] = [
  ["Curious Cows at Marholm, Acrylic", "Curious Cows at Marholm", "Acrylic"],
  ["EDALE-Penine Way, Oil", "EDALE-Penine Way", "Oil"],
  ["Street scene -CAGNES SUR MER, Watercolour", "Street scene -CAGNES SUR MER", "Watercolour"],
  ["The Shallows - Acrylic", "The Shallows", "Acrylic"],
  ["No title.  Acrylic, collage, watercolour on board", "No title", "Acrylic, collage, watercolour on board"],
  ["Michigan Winter. Watercolour on paper", "Michigan Winter", "Watercolour on paper"],
  ["Silver Lake Acrylic on board", "Silver Lake", "Acrylic on board"],
  ["No title Mixed Media stitched Collage on paper", "No title", "Mixed media stitched collage on paper"],
  ["BEETHOVEN ACRYLIC ON CANVAS", "Beethoven", "Acrylic on canvas"],
  ["MENTAL HEALTH 1. ACRYLIC ON CANVAS", "Mental Health 1", "Acrylic on canvas"],
  ["NIGHT DRIVING - AZINHAL  CANVAS", "Night Driving - Azinhal", "Canvas"],
  ["RELEASING ANGELS.  CANVAS", "Releasing Angels", "Canvas"],
  ["Splash!  - mixed media, acrylic, collage, pastel", "Splash!", "Mixed media, acrylic, collage, pastel"],
  ["Rain on Sunday       media, acrylic, collage, pastel, graphite", "Rain on Sunday", "Media, acrylic, collage, pastel, graphite"],
  ["High Water-  mixed media, acrylic, collage, pastel, graphite", "High Water", "Mixed media, acrylic, collage, pastel, graphite"],
];

describe("splitTitleAndMedium (guessing from combined text)", () => {
  it.each(cases)("%s", (combined, title, medium) => {
    expect(splitTitleAndMedium(combined, "")).toEqual({ title, medium, guessed: true });
  });

  it("leaves the medium empty when no medium words are found", () => {
    expect(splitTitleAndMedium("MENTAL HEALTH 2", "")).toEqual({ title: "Mental Health 2", medium: "", guessed: true });
  });

  it("does not treat a medium word inside the title as the medium", () => {
    expect(splitTitleAndMedium("Paper Boats", "").medium).toBe("");
  });
});

describe("splitTitleAndMedium (separate Medium field)", () => {
  it("uses the Medium field as given, tidied", () => {
    expect(splitTitleAndMedium("Beethoven", "ACRYLIC ON CANVAS")).toEqual({
      title: "Beethoven",
      medium: "Acrylic on canvas",
      guessed: false,
    });
  });

  it("does not split the title when a medium is supplied", () => {
    expect(splitTitleAndMedium("Paper and Canvas", "Oil").title).toBe("Paper and Canvas");
  });
});

describe("tidying", () => {
  it("title-cases all-capital titles only", () => {
    expect(tidyTitle("GARDEN AT MENTON")).toBe("Garden At Menton");
    expect(tidyTitle("Garden at MENTON")).toBe("Garden at MENTON");
  });

  it("sentence-cases media", () => {
    expect(tidyMedium("  Mixed Media,  ACRYLIC ")).toBe("Mixed media, acrylic");
  });
});

describe("untitled works", () => {
  it("recognises the usual ways of saying untitled", () => {
    for (const t of ["", "No title", "no title.", "Untitled", "N/A"]) expect(isUntitled(t)).toBe(true);
    expect(isUntitled("Silver Lake")).toBe(false);
  });

  it("numbers several untitled works in order", () => {
    expect(numberUntitled(["No title", "Michigan Winter", "", "Skye Blue", "untitled"])).toEqual([
      "Untitled 1",
      "Michigan Winter",
      "Untitled 2",
      "Skye Blue",
      "Untitled 3",
    ]);
  });

  it("uses plain 'Untitled' for a single untitled work", () => {
    expect(numberUntitled(["No title", "Silver Lake"])).toEqual(["Untitled", "Silver Lake"]);
  });
});
