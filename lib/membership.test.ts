import { describe, expect, it } from "vitest";
import { isMobile, paymentReference, toMemberFields, validateMembership, type MembershipInput } from "./membership";

const base = (o: Partial<MembershipInput> = {}): MembershipInput => ({
  firstName: " jo ",
  surname: "O'Brien-Smith",
  address: "1 High Street\nStamford PE9 1AA",
  phone: "07700 900123",
  email: " Jo@Example.com",
  payment: "paid",
  website: "",
  ...o,
});

describe("paymentReference", () => {
  it("is the surname in capitals plus first initial, letters only", () => {
    expect(paymentReference("jo", "O'Brien-Smith")).toBe("OBRIENSMITHJ");
    expect(paymentReference("Ann", "Lee")).toBe("LEEA");
    expect(paymentReference("", "Lee")).toBe("");
  });
});

describe("isMobile", () => {
  it("recognises UK mobile numbers", () => {
    expect(isMobile("07700 900123")).toBe(true);
    expect(isMobile("+44 7700 900123")).toBe(true);
    expect(isMobile("01780 123456")).toBe(false);
  });
});

describe("validateMembership", () => {
  it("accepts a complete application and tidies it", () => {
    const r = validateMembership(base());
    expect(r.ok && r.application).toEqual({
      firstName: "Jo",
      surname: "O'Brien-Smith",
      address: "1 High Street\nStamford PE9 1AA",
      phone: "07700 900123",
      email: "jo@example.com",
      payment: "paid",
    });
  });

  it("needs every field and an answer about payment", () => {
    const r = validateMembership(base({ firstName: "", address: " ", phone: "12", email: "x", payment: "" }));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["address", "email", "firstName", "payment", "phone"]);
  });

  it("accepts applicants who haven't paid yet", () => {
    expect(validateMembership(base({ payment: "later" })).ok).toBe(true);
  });

  it("turns away the hidden bot field", () => {
    expect(validateMembership(base({ website: "spam" })).ok).toBe(false);
  });
});

describe("toMemberFields", () => {
  const app = (phone: string, payment = "paid") => {
    const r = validateMembership(base({ phone, payment }));
    if (!r.ok) throw new Error("expected ok");
    return r.application;
  };

  it("fills the master table fields, flags it as a new associate and notes the reference", () => {
    expect(toMemberFields(app("07700 900123"), { today: "2026-11-19" })).toEqual({
      "First Name": "Jo",
      Surname: "O'Brien-Smith",
      Address: "1 High Street\nStamford PE9 1AA",
      Mobile: "07700 900123",
      Email: "jo@example.com",
      "Membership Type": "Associate",
      "New Associate Membership": ["New Associate Membership Application"],
      "Date Joined": "2026-11-19",
      Notes: "Applied online 19/11/2026, ref OBRIENSMITHJ, applicant says paid",
    });
  });

  it("notes when payment is to follow", () => {
    expect(toMemberFields(app("07700 900123", "later"), { today: "2026-11-19" }).Notes).toBe(
      "Applied online 19/11/2026, ref OBRIENSMITHJ, payment to follow",
    );
  });

  it("puts landlines in Phone", () => {
    const fields = toMemberFields(app("01780 123456"), { today: "2026-11-19" });
    expect(fields.Phone).toBe("01780 123456");
    expect(fields.Mobile).toBeUndefined();
  });
});
