import { describe, expect, it } from "vitest";
import { initialsFor, uniqueInitials } from "./initials";

describe("initialsFor", () => {
  it("takes the first letter of each name", () => {
    expect(initialsFor("Ruth", "Beaver")).toBe("RB");
  });

  it("copes with brackets, hyphens and lower case", () => {
    expect(initialsFor("Anne", "Fitzgerald (McLeod)")).toBe("AF");
    expect(initialsFor("shani", "wray-jenkins")).toBe("SW");
  });

  it("returns ? when there is nothing to use", () => {
    expect(initialsFor("", "")).toBe("?");
  });
});

describe("uniqueInitials", () => {
  it("numbers repeated initials in order", () => {
    expect(
      uniqueInitials([
        { firstName: "Ruth", surname: "Beaver" },
        { firstName: "Mark", surname: "Hayler" },
        { firstName: "Rob", surname: "Brown" },
        { firstName: "Rosa", surname: "Bell" },
      ]),
    ).toEqual(["RB", "MH", "RB 2", "RB 3"]);
  });
});
