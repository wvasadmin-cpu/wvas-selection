import { describe, expect, it } from "vitest";
import { claimMatches, decideClaim } from "./claims";

const claim = { deviceId: "dev-1", claimedAt: "2026-11-03T10:00:00Z" };

describe("decideClaim", () => {
  it("allows the device that holds the name", () => {
    expect(decideClaim(claim, true, "dev-1", false)).toBe("allow");
  });

  it("blocks any other device, even if they confirm", () => {
    expect(decideClaim(claim, true, "dev-2", true)).toBe("blocked");
    expect(decideClaim(claim, false, "dev-2", false)).toBe("blocked");
  });

  it("asks first for an unclaimed name that already has votes", () => {
    expect(decideClaim(null, true, "dev-2", false)).toBe("confirm");
    expect(decideClaim(null, true, "dev-2", true)).toBe("allow");
  });

  it("allows an unclaimed name with no votes", () => {
    expect(decideClaim(null, false, "dev-2", false)).toBe("allow");
  });
});

describe("claimMatches", () => {
  it("needs a claim and the same device", () => {
    expect(claimMatches(claim, "dev-1")).toBe(true);
    expect(claimMatches(claim, "dev-2")).toBe(false);
    expect(claimMatches(claim, undefined)).toBe(false);
    expect(claimMatches(null, "dev-1")).toBe(false);
  });
});
