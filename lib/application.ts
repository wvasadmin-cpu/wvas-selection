// Checking an exhibitor application and turning it into an Airtable record.
// Pure, so it can be tested; the server action does the storage and sending.

import { FIELDS } from "./airtable-fields";

export type WorkType = "2d" | "3d" | "mixed";

/** Six works for 2D or a mix of 2D and 3D; four for 3D. */
export function artworkCount(type: WorkType): number {
  return type === "3d" ? 4 : 6;
}

export type ApplicationInput = {
  firstName: string;
  surname: string;
  address: string;
  phone: string;
  email: string;
  experience: string;
  qualifications: string;
  otherMembership: string;
  workType: string;
  artworks: { title: string; medium: string; photoId: string }[];
  declaration: boolean;
  /** Hidden field that people never see; bots tend to fill it in. */
  website: string;
};

export type CleanApplication = Omit<ApplicationInput, "workType" | "website"> & { workType: WorkType };

export type Validation = { ok: true; application: CleanApplication } | { ok: false; errors: Record<string, string> };

const PHOTO_ID = /^[A-Za-z0-9_-]{20,40}$/;

function clean(text: unknown, max: number): string {
  return String(text ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function oneLine(text: unknown, max: number): string {
  return clean(text, max).replace(/\s+/g, " ");
}

export function validateApplication(input: ApplicationInput): Validation {
  const errors: Record<string, string> = {};
  const firstName = oneLine(input.firstName, 60);
  const surname = oneLine(input.surname, 60);
  const address = clean(input.address, 400);
  const phone = oneLine(input.phone, 30);
  const email = oneLine(input.email, 120).toLowerCase();
  const experience = clean(input.experience, 5000);
  const qualifications = clean(input.qualifications, 2000);
  const otherMembership = clean(input.otherMembership, 1000);

  if (!firstName) errors.firstName = "Please enter your first name.";
  if (!surname) errors.surname = "Please enter your surname.";
  if (!address) errors.address = "Please enter your address and postcode.";
  if (!/^[+0-9 ()-]{7,}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Please enter a phone number we can reach you on.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";

  const workType = (["2d", "3d", "mixed"] as const).find((t) => t === input.workType);
  if (!workType) errors.workType = "Please say whether your work is 2D, 3D or a mix.";

  const count = workType ? artworkCount(workType) : 0;
  const artworks = (input.artworks ?? []).slice(0, count).map((a) => ({
    title: oneLine(a?.title, 120),
    medium: oneLine(a?.medium, 160),
    photoId: String(a?.photoId ?? ""),
  }));
  for (let i = 0; i < count; i++) {
    const a = artworks[i];
    if (!a?.title) errors[`title${i}`] = "Please give a title (or \"Untitled\").";
    if (!a?.medium) errors[`medium${i}`] = "Please give the medium.";
    if (!a || !PHOTO_ID.test(a.photoId)) errors[`photo${i}`] = "Please add a photo of this work.";
  }

  if (input.declaration !== true) errors.declaration = "Please tick the declaration to confirm the works are your own.";
  if (clean(input.website, 200)) errors.form = "Sorry, something went wrong. Please try again.";

  if (Object.keys(errors).length || !workType) return { ok: false, errors };
  return {
    ok: true,
    application: { firstName, surname, address, phone, email, experience, qualifications, otherMembership, workType, artworks, declaration: true },
  };
}

/** The Airtable fields for a checked application. */
export function toAirtableFields(
  app: CleanApplication,
  options: { roundName: string; today: string; photoUrl: (photoId: string) => string },
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    [FIELDS.firstName]: app.firstName,
    [FIELDS.surname]: app.surname,
    [FIELDS.address]: app.address,
    [FIELDS.phone]: app.phone,
    [FIELDS.email]: app.email,
    [FIELDS.declaration]: true,
    [FIELDS.date]: options.today,
    [FIELDS.round]: options.roundName,
  };
  if (app.experience) fields[FIELDS.bio] = app.experience;
  if (app.qualifications) fields[FIELDS.qualifications] = app.qualifications;
  if (app.otherMembership) fields[FIELDS.otherMembership] = app.otherMembership;
  app.artworks.forEach((a, i) => {
    const slot = i + 1;
    fields[FIELDS.artwork(slot)] = a.title;
    fields[FIELDS.medium(slot)] = a.medium;
    fields[FIELDS.image(slot)] = [{ url: options.photoUrl(a.photoId), filename: `artwork-${slot}.jpg` }];
  });
  return fields;
}
