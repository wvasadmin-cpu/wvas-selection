import { describe, it, expect } from "vitest";
import { isAllowedEmail } from "./allowlist";

describe("isAllowedEmail", () => {
  const list = "mat3740@gmail.com, twardill@gmail.com";

  it("allows a listed email", () => {
    expect(isAllowedEmail("mat3740@gmail.com", list)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowedEmail("TWardill@Gmail.com", list)).toBe(true);
  });

  it("trims whitespace around entries", () => {
    expect(isAllowedEmail("twardill@gmail.com", list)).toBe(true);
  });

  it("rejects an unlisted email", () => {
    expect(isAllowedEmail("stranger@gmail.com", list)).toBe(false);
  });

  it("rejects null/empty email", () => {
    expect(isAllowedEmail(null, list)).toBe(false);
    expect(isAllowedEmail("", list)).toBe(false);
  });

  it("rejects everyone when the list is empty/undefined", () => {
    expect(isAllowedEmail("mat3740@gmail.com", "")).toBe(false);
    expect(isAllowedEmail("mat3740@gmail.com", undefined)).toBe(false);
  });
});
