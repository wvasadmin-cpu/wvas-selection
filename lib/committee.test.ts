import { describe, expect, it } from "vitest";
import { addMember, parsePastedNames, removeMember, renameMember, sortMembers, type CommitteeMember } from "./committee";

describe("parsePastedNames", () => {
  it("reads plain names one per line", () => {
    expect(parsePastedNames("Alex Example\n\n  Sam   Sample \n")).toEqual([{ name: "Alex Example" }, { name: "Sam Sample" }]);
  });

  it("reads spreadsheet rows, keeping a leading number as the id and skipping the header", () => {
    expect(parsePastedNames("ID\tFirst Name\tSurname\n114\tAlex\tExample\r\n7\tSam\tSample-Smith")).toEqual([
      { name: "Alex Example", sourceId: "114" },
      { name: "Sam Sample-Smith", sourceId: "7" },
    ]);
  });
});

// Placeholder names only: the real list lives in the site's storage, not the code.
const list: CommitteeMember[] = [
  { id: "1", name: "Alex Example" },
  { id: "2", name: "Sam Sample" },
];

describe("committee list", () => {
  it("adds a tidied name and keeps the list sorted", () => {
    const result = addMember(list, "  Jo   Test ", "3");
    expect(result).toEqual({
      ok: true,
      members: [
        { id: "1", name: "Alex Example" },
        { id: "3", name: "Jo Test" },
        { id: "2", name: "Sam Sample" },
      ],
    });
  });

  it("refuses blank and duplicate names", () => {
    expect(addMember(list, "   ", "3").ok).toBe(false);
    expect(addMember(list, "alex example", "3").ok).toBe(false);
  });

  it("renames by id, refusing a clash with someone else", () => {
    expect(renameMember(list, "2", "Sam Sampleton")).toEqual({
      ok: true,
      members: [
        { id: "1", name: "Alex Example" },
        { id: "2", name: "Sam Sampleton" },
      ],
    });
    expect(renameMember(list, "2", "Alex Example").ok).toBe(false);
    expect(renameMember(list, "2", "sam sample").ok).toBe(true);
  });

  it("removes by id", () => {
    expect(removeMember(list, "1")).toEqual({ ok: true, members: [{ id: "2", name: "Sam Sample" }] });
    expect(removeMember(list, "9").ok).toBe(false);
  });

  it("sorts ignoring case", () => {
    expect(sortMembers([{ id: "a", name: "bea" }, { id: "b", name: "Ann" }]).map((m) => m.name)).toEqual(["Ann", "bea"]);
  });
});
