import { describe, expect, it } from "vitest";
import { associateAck, exhibitorAck, maskPhone } from "./ack-email";

describe("maskPhone", () => {
  it("shows only the last three digits", () => {
    expect(maskPhone("07700 900123")).toBe("ending 123");
    expect(maskPhone("")).toBe("");
  });
});

const member = {
  firstName: "Jo",
  surname: "Example",
  address: "1 High Street\nStamford PE9 1AA",
  phone: "07700 900123",
  email: "jo@example.com",
};

describe("associateAck", () => {
  it("thanks someone who has paid, with their reference, as a plain letter", () => {
    const m = associateAck({ ...member, payment: "paid" });
    expect(m.to).toBe("jo@example.com");
    expect(m.subject).toBe("Your WVAS Associate Membership application");
    expect(m.text).toContain("Dear Jo,");
    expect(m.text).toContain("using the reference EXAMPLEJ");
    expect(m.text).not.toContain("00249374");
    expect(m.text + m.html).not.toContain("High Street");
    expect(m.text + m.html).not.toContain("900123");
    expect(m.html).not.toContain("<table");
  });

  it("reminds someone who hasn't paid, with the bank details and their reference", () => {
    const m = associateAck({ ...member, payment: "later" });
    expect(m.text).toContain("If you haven't yet paid the £10 annual fee");
    expect(m.text).toContain("account 00249374, sort code 30-98-02, reference EXAMPLEJ.");
    expect(m.html).toContain("EXAMPLEJ");
  });

  it("escapes anything typed into the form", () => {
    expect(associateAck({ ...member, firstName: "<b>Jo</b>", payment: "paid" }).html).toContain("&lt;b&gt;Jo&lt;/b&gt;");
  });
});

describe("exhibitorAck", () => {
  const app = {
    ...member,
    experience: "",
    qualifications: "BA Fine Art",
    otherMembership: "",
    workType: "3d" as const,
    artworks: [1, 2, 3, 4].map((n) => ({ title: `Work ${n}`, medium: "Bronze", photoId: `photo${n}` })),
    declaration: true as const,
  };
  const m = exhibitorAck(app, {
    roundName: "March 27",
    closesOn: "2027-01-15",
    viewing: "Monday 1 February 2027 at 2pm, Stamford Arts Centre",
    today: "2026-11-20",
    thumbUrl: (id) => `https://site/api/uploads/${id}?size=thumb`,
  });

  it("summarises the application with dates, works and declaration", () => {
    expect(m.subject).toBe("Application received: WVAS Exhibitor Membership (March 27)");
    expect(m.text).toContain("Applications close: Friday 15 January 2027");
    expect(m.text).toContain("Viewing and Voting Day: Monday 1 February 2027 at 2pm, Stamford Arts Centre");
    expect(m.text).toContain("YOUR WORK: 3D");
    expect(m.text).toContain("  4. Work 4 (Bronze)");
    expect(m.text).toContain("Qualifications: BA Fine Art");
    expect(m.text).not.toContain("Experience:");
    expect(m.text).toContain("Confirmed on Friday 20 November 2026");
    expect(m.text + m.html).not.toContain("High Street");
  });

  it("includes a small picture of each work", () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => ({ cid: `artwork${n}`, url: `https://site/api/uploads/photo${n}?size=thumb` })));
    expect(m.html).toContain('src="cid:artwork4"');
  });
});
