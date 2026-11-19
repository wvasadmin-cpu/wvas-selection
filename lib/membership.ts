// Checking an associate membership application and turning it into a record
// for the master membership table. Pure, so it can be tested.

import { ASSOCIATE_TYPE, MEMBER_FIELDS, NEW_ASSOCIATE_FLAG } from "./member-fields";
import { tidyCase } from "./name-match";

export type MembershipInput = {
  firstName: string;
  surname: string;
  address: string;
  phone: string;
  email: string;
  paid: boolean;
  /** Hidden field that people never see; bots tend to fill it in. */
  website: string;
};

export type CleanMembership = Omit<MembershipInput, "website" | "paid">;

export type MembershipValidation =
  | { ok: true; application: CleanMembership }
  | { ok: false; errors: Record<string, string> };

function oneLine(text: unknown, max: number): string {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** The bank payment reference: surname in capitals plus first initial, e.g. SMITHJ. */
export function paymentReference(firstName: string, surname: string): string {
  const letters = (s: string) => (s ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  const sur = letters(surname);
  const initial = letters(firstName).charAt(0);
  return sur && initial ? `${sur}${initial}` : "";
}

/** UK mobiles start 07 (or +44 7 / 0044 7). */
export function isMobile(phone: string): boolean {
  const digits = phone.replace(/[^\d+]/g, "");
  return /^(07|\+447|00447)\d+$/.test(digits);
}

export function validateMembership(input: MembershipInput): MembershipValidation {
  const errors: Record<string, string> = {};
  const firstName = tidyCase(oneLine(input.firstName, 60));
  const surname = tidyCase(oneLine(input.surname, 60));
  const address = String(input.address ?? "").replace(/\r\n/g, "\n").trim().slice(0, 400);
  const phone = oneLine(input.phone, 30);
  const email = oneLine(input.email, 120).toLowerCase();

  if (!firstName) errors.firstName = "Please enter your first name.";
  if (!surname) errors.surname = "Please enter your surname.";
  if (!address) errors.address = "Please enter your address and postcode.";
  if (!/^[+0-9 ()-]{7,}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Please enter a phone number we can reach you on.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
  if (input.paid !== true) errors.paid = "Please make your payment first, then tick to confirm.";
  if (oneLine(input.website, 200)) errors.form = "Sorry, something went wrong. Please try again.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, application: { firstName, surname, address, phone, email } };
}

/** "2026-11-19" -> "19/11/2026" */
function ukDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function toMemberFields(app: CleanMembership, options: { today: string }): Record<string, unknown> {
  const reference = paymentReference(app.firstName, app.surname);
  return {
    [MEMBER_FIELDS.firstName]: app.firstName,
    [MEMBER_FIELDS.surname]: app.surname,
    [MEMBER_FIELDS.address]: app.address,
    [isMobile(app.phone) ? MEMBER_FIELDS.mobile : MEMBER_FIELDS.phone]: app.phone,
    [MEMBER_FIELDS.email]: app.email,
    [MEMBER_FIELDS.membershipType]: ASSOCIATE_TYPE,
    [MEMBER_FIELDS.newAssociate]: [NEW_ASSOCIATE_FLAG],
    [MEMBER_FIELDS.dateJoined]: options.today,
    [MEMBER_FIELDS.notes]: `Applied online ${ukDate(options.today)}, ref ${reference}, applicant says paid`,
  };
}
