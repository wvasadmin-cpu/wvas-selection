import { describe, expect, it } from "vitest";
import { artworkCount, toAirtableFields, validateApplication, type ApplicationInput } from "./application";
import { intakeStatus, longDate, ukToday } from "./intake";

const photo = (n: number) => `photo${n}abcdefghijklmnopqrstu`;
const base = (overrides: Partial<ApplicationInput> = {}): ApplicationInput => ({
  firstName: " Jo ",
  surname: "Example",
  address: "1 High Street\nStamford PE9 1AA",
  phone: "01780 123456",
  email: " Jo@Example.com ",
  experience: "",
  qualifications: "BA Fine Art",
  otherMembership: "",
  workType: "2d",
  artworks: Array.from({ length: 6 }, (_, i) => ({ title: `Work ${i + 1}`, medium: "Oil on canvas", photoId: photo(i) })),
  declaration: true,
  website: "",
  ...overrides,
});

describe("validateApplication", () => {
  it("accepts a complete 2D application and tidies it", () => {
    const result = validateApplication(base());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.firstName).toBe("Jo");
      expect(result.application.email).toBe("jo@example.com");
      expect(result.application.artworks).toHaveLength(6);
    }
  });

  it("needs four works for 3D and ignores extras", () => {
    expect(artworkCount("3d")).toBe(4);
    const result = validateApplication(base({ workType: "3d" }));
    expect(result.ok && result.application.artworks.length).toBe(4);
  });

  it("needs six works for a mix", () => {
    const result = validateApplication(base({ workType: "mixed", artworks: base().artworks.slice(0, 4) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["title4", "medium4", "photo4", "title5", "medium5", "photo5"]);
  });

  it("requires a photo, title and medium for every work", () => {
    const artworks = base().artworks.map((a, i) => (i === 2 ? { title: "", medium: " ", photoId: "" } : a));
    const result = validateApplication(base({ artworks }));
    expect(!result.ok && result.errors).toEqual({
      title2: 'Please give a title (or "Untitled").',
      medium2: "Please give the medium.",
      photo2: "Please add a photo of this work.",
    });
  });

  it("checks contact details, work type and the declaration", () => {
    const result = validateApplication(base({ email: "nope", phone: "12", workType: "", declaration: false, firstName: "" }));
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["declaration", "email", "firstName", "phone", "workType"]);
  });

  it("turns away the hidden bot field", () => {
    expect(validateApplication(base({ website: "http://spam" })).ok).toBe(false);
  });
});

describe("toAirtableFields", () => {
  it("fills the existing Airtable fields, with the date and round added", () => {
    const result = validateApplication(base({ workType: "3d" }));
    if (!result.ok) throw new Error("expected ok");
    const fields = toAirtableFields(result.application, {
      roundName: "March 27",
      today: "2026-11-17",
      photoUrl: (id) => `https://site/api/uploads/${id}`,
    });
    expect(fields).toMatchObject({
      "First Name": "Jo",
      Surname: "Example",
      "Address and Postcode": "1 High Street\nStamford PE9 1AA",
      "Phone Number": "01780 123456",
      Email: "jo@example.com",
      Qualifications: "BA Fine Art",
      Declaration: true,
      Date: "2026-11-17",
      "Date of Submission": "March 27",
      "Artwork 4": "Work 4",
      "Medium 4": "Oil on canvas",
      "Image 4": [{ url: `https://site/api/uploads/${photo(3)}`, filename: "artwork-4.jpg" }],
    });
    expect(fields["Artwork 5"]).toBeUndefined();
    expect(fields["Previous Experience"]).toBeUndefined();
  });
});

describe("intake", () => {
  const intake = { roundName: "March 27", closesOn: "2027-01-15", viewing: "x", open: true };

  it("is open up to the end of the closing day, UK time", () => {
    expect(intakeStatus(intake, new Date("2027-01-15T23:30:00Z"))).toBe("open");
    expect(intakeStatus(intake, new Date("2027-01-16T00:30:00Z"))).toBe("closed");
  });

  it("can be closed early, and needs setting up first", () => {
    expect(intakeStatus({ ...intake, open: false }, new Date("2026-12-01T12:00:00Z"))).toBe("closed");
    expect(intakeStatus(null)).toBe("not-set");
  });

  it("formats dates", () => {
    expect(longDate("2027-01-15")).toBe("Friday 15 January 2027");
    expect(ukToday(new Date("2026-07-01T23:30:00Z"))).toBe("2026-07-02");
  });
});
