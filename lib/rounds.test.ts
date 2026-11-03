import { describe, expect, it } from "vitest";
import { cleanPasscode, passcodeMatches, roundKey } from "./rounds";

describe("roundKey", () => {
  it("makes a storage-safe key", () => {
    expect(roundKey(" March 27 ")).toBe("march-27");
    expect(roundKey("Sept/2026!")).toBe("sept-2026");
    expect(roundKey("***")).toBe("round");
  });
});

describe("passcodes", () => {
  it("tidies what the admin types", () => {
    expect(cleanPasscode("  blue   heron ")).toBe("blue heron");
  });

  it("matches ignoring case and outer spaces", () => {
    expect(passcodeMatches("Heron", " heron ")).toBe(true);
    expect(passcodeMatches("Heron", "egret")).toBe(false);
  });

  it("lets anyone in when no passcode is set", () => {
    expect(passcodeMatches("", "")).toBe(true);
  });
});
