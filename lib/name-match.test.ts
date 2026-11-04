import { describe, expect, it } from "vitest";
import { cleanTypedName, displayName, matchMember } from "./name-match";

// Made-up committee, shaped like the real one.
const members = [
  { id: "1", name: "Susan Fielding" },
  { id: "2", name: "Michael Brook" },
  { id: "3", name: "Dana Ward-Hill" },
  { id: "4", name: "Rachel Moor" },
  { id: "5", name: "Robert Lane" },
  { id: "6", name: "Rosa Lane" },
];

const match = (first: string, surname: string) => matchMember(cleanTypedName(first, surname), members)?.id ?? null;

describe("matchMember", () => {
  it("matches exact names ignoring case and spaces", () => {
    expect(match("  susan ", "FIELDING")).toBe("1");
  });

  it("accepts short forms and nicknames", () => {
    expect(match("Sue", "Fielding")).toBe("1");
    expect(match("Mike", "Brook")).toBe("2");
    expect(match("Mick", "Brook")).toBe("2");
  });

  it("accepts a middle initial or extra word in the first name", () => {
    expect(match("Rachel E", "Moor")).toBe("4");
  });

  it("ignores hyphens, spaces and apostrophes in surnames", () => {
    expect(match("Dana", "Ward Hill")).toBe("3");
    expect(match("Dana", "wardhill")).toBe("3");
  });

  it("needs the surname to match", () => {
    expect(match("Susan", "Fielder")).toBeNull();
  });

  it("doesn't match a clearly different first name", () => {
    expect(match("Tom", "Brook")).toBeNull();
  });

  it("tells apart two members with the same surname", () => {
    expect(match("Rob", "Lane")).toBe("5");
    expect(match("Rosa", "Lane")).toBe("6");
    expect(match("R", "Lane")).toBeNull();
  });

  it("copes with the whole name typed into the first box", () => {
    expect(match("Michael Brook", "")).toBe("2");
  });
});

describe("cleanTypedName", () => {
  it("tidies and splits", () => {
    expect(cleanTypedName("  Jo   Ann ", " Smith ")).toEqual({ first: "Jo Ann", surname: "Smith" });
    expect(cleanTypedName("Jo Smith", "")).toEqual({ first: "Jo", surname: "Smith" });
    expect(displayName({ first: "Jo", surname: "Smith" })).toBe("Jo Smith");
  });

  it("tidies all-lower or all-upper case, leaving mixed case alone", () => {
    expect(cleanTypedName("alex", "EXAMPLE")).toEqual({ first: "Alex", surname: "Example" });
    expect(cleanTypedName("dana", "ward-hill")).toEqual({ first: "Dana", surname: "Ward-Hill" });
    expect(cleanTypedName("Ann", "McLeod")).toEqual({ first: "Ann", surname: "McLeod" });
  });
});
