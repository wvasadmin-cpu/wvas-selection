import { describe, expect, it } from "vitest";
import { nextCopied, photosToCopy } from "./photo-plan";

const sources = [
  { artworkId: "a-1", sourceId: "att1" },
  { artworkId: "a-2", sourceId: "att2" },
  { artworkId: "b-1", sourceId: "att3" },
];

describe("photosToCopy", () => {
  it("copies everything the first time", () => {
    expect(photosToCopy(sources, undefined)).toEqual(sources);
  });

  it("skips photos already copied from the same attachment, recopies changed ones", () => {
    expect(photosToCopy(sources, { "a-1": "att1", "a-2": "OLD", "b-1": "att3" })).toEqual([sources[1]]);
  });
});

describe("nextCopied", () => {
  it("keeps still-valid copies, adds new ones and drops artworks no longer in the round", () => {
    expect(nextCopied(sources, { "a-1": "att1", "a-2": "OLD", "gone-1": "x" }, [sources[1]])).toEqual({
      "a-1": "att1",
      "a-2": "att2",
    });
  });
});
