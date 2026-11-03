// The Airtable field names this site reads, in one place. If a field is
// renamed in Airtable, change it here and nothing else needs to move.
// Only these fields are ever requested: addresses, phone numbers and emails
// are never read.

export const ARTWORK_SLOTS = 6;

export const FIELDS = {
  firstName: "First Name",
  surname: "Surname",
  bio: "Previous Experience",
  qualifications: "Qualifications",
  otherMembership: "Other Membership",
  round: "Date of Submission",
  artwork: (slot: number) => `Artwork ${slot}`,
  medium: (slot: number) => `Medium ${slot}`,
  image: (slot: number) => `Image ${slot}`,
} as const;

/** Every field name to request from Airtable, in a stable order. */
export function fieldsToRead(): string[] {
  const names: string[] = [
    FIELDS.firstName,
    FIELDS.surname,
    FIELDS.bio,
    FIELDS.qualifications,
    FIELDS.otherMembership,
    FIELDS.round,
  ];
  for (let slot = 1; slot <= ARTWORK_SLOTS; slot++) {
    names.push(FIELDS.artwork(slot), FIELDS.medium(slot), FIELDS.image(slot));
  }
  return names;
}
