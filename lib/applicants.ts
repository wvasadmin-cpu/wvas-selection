// Turning Airtable records into applicants. Pure: no network, so it can be tested.

import { ARTWORK_SLOTS, FIELDS } from "./airtable-fields";
import { numberUntitled, splitTitleAndMedium } from "./artwork";
import { uniqueInitials } from "./initials";
import type { Applicant } from "./types";

export type AirtableAttachment = {
  id?: string;
  url: string;
  filename?: string;
  type?: string;
  thumbnails?: { large?: { url: string }; full?: { url: string } };
};

export type AirtableRecord = { id: string; createdTime?: string; fields: Record<string, unknown> };

/**
 * Where each artwork's photo can be fetched from (Airtable links expire after a
 * few hours). `sourceId` identifies the photo itself, so an unchanged photo
 * isn't copied again on refresh.
 */
export type ImageSource = { artworkId: string; url: string; thumbUrl: string; filename: string; sourceId: string };

const WEB_PHOTO = /^image\/(jpeg|png|webp)$/;

export type ApplicantWithImages = {
  applicant: Applicant;
  images: ImageSource[];
  /** When the application was submitted (Airtable's record creation time). */
  submittedAt: string;
  /**
   * If someone with the same name sent a newer application in this round
   * (e.g. after changing their works), the id of that newer one; else null.
   */
  replacedBy: string | null;
};

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(", ").trim();
  if (value && typeof value === "object" && "name" in value) return String((value as { name: unknown }).name).trim();
  return "";
}

function firstAttachment(value: unknown): AirtableAttachment | null {
  if (!Array.isArray(value)) return null;
  const att = value.find((a) => a && typeof a === "object" && typeof (a as AirtableAttachment).url === "string");
  return (att as AirtableAttachment) ?? null;
}

/** The round an application belongs to, e.g. "March 27". */
export function roundOf(record: AirtableRecord): string {
  return text(record.fields[FIELDS.round]).replace(/\s+/g, " ");
}

export function toApplicant(record: AirtableRecord, initials: string): Pick<ApplicantWithImages, "applicant" | "images"> {
  const f = record.fields;
  const images: ImageSource[] = [];
  const raw = [];

  for (let slot = 1; slot <= ARTWORK_SLOTS; slot++) {
    const artworkText = text(f[FIELDS.artwork(slot)]);
    const mediumText = text(f[FIELDS.medium(slot)]);
    const attachment = firstAttachment(f[FIELDS.image(slot)]);
    if (!artworkText && !mediumText && !attachment) continue;

    const id = `${record.id}-${slot}`;
    const split = splitTitleAndMedium(artworkText, mediumText);
    raw.push({ id, slot, title: split.title, medium: split.medium, mediumGuessed: split.guessed, hasImage: !!attachment });
    if (attachment) {
      images.push({
        artworkId: id,
        // The original when it's an ordinary web photo (most detail to zoom into);
        // otherwise Airtable's full-size web version, which works even for iPhone
        // HEIC photos. The small thumbnail is for the admin preview grid.
        url: WEB_PHOTO.test(attachment.type ?? "") ? attachment.url : (attachment.thumbnails?.full?.url ?? attachment.url),
        thumbUrl: attachment.thumbnails?.large?.url ?? attachment.url,
        filename: attachment.filename ?? `image-${slot}`,
        sourceId: attachment.id ?? attachment.filename ?? attachment.url,
      });
    }
  }

  const titles = numberUntitled(raw.map((a) => a.title));
  const artworks = raw.map((a, i) => ({ ...a, title: titles[i] }));

  const firstName = text(f[FIELDS.firstName]);
  const surname = text(f[FIELDS.surname]);

  return {
    applicant: {
      id: record.id,
      initials,
      fullName: `${firstName} ${surname}`.trim(),
      bio: text(f[FIELDS.bio]),
      qualifications: text(f[FIELDS.qualifications]),
      otherMembership: text(f[FIELDS.otherMembership]),
      artworks,
    },
    images,
  };
}

/** An applicant with no artworks at all (e.g. "tbc") is left out of a round. */
export function isIncomplete(applicant: Applicant): boolean {
  return applicant.artworks.length === 0;
}

/** Same person, as far as the name goes: letters only, ignoring case, spaces and punctuation. */
function nameKey(r: AirtableRecord): string {
  return `${text(r.fields[FIELDS.firstName])}|${text(r.fields[FIELDS.surname])}`.toLowerCase().replace(/[^a-z|]/g, "");
}

/**
 * All applicants in one round, in Airtable order, with unique initials. Where
 * the same name applied more than once, earlier applications are marked as
 * replaced by the newest (applicants are asked to send a new form if their
 * works change).
 */
export function applicantsForRound(records: AirtableRecord[], round: string): ApplicantWithImages[] {
  const inRound = records.filter((r) => roundOf(r).toLowerCase() === round.trim().toLowerCase());

  // The newest application for each name (by submission time, then Airtable order).
  const newest = new Map<string, { record: AirtableRecord; index: number }>();
  inRound.forEach((record, index) => {
    const key = nameKey(record);
    if (key === "|") return;
    const current = newest.get(key);
    const later =
      !current || (record.createdTime ?? "") > (current.record.createdTime ?? "") ||
      ((record.createdTime ?? "") === (current.record.createdTime ?? "") && index > current.index);
    if (later) newest.set(key, { record, index });
  });
  const replacedBy = inRound.map((r) => {
    const latest = newest.get(nameKey(r));
    return latest && latest.record.id !== r.id ? latest.record.id : null;
  });

  // Current applications get the plain initials ("RB"); replaced ones come after ("RB 2").
  const order = inRound.map((_, i) => i).sort((a, b) => Number(replacedBy[a] !== null) - Number(replacedBy[b] !== null));
  const sortedInitials = uniqueInitials(
    order.map((i) => ({ firstName: text(inRound[i].fields[FIELDS.firstName]), surname: text(inRound[i].fields[FIELDS.surname]) })),
  );
  const initials: string[] = [];
  order.forEach((i, k) => (initials[i] = sortedInitials[k]));

  return inRound.map((r, i) => ({
    ...toApplicant(r, initials[i]),
    submittedAt: r.createdTime ?? "",
    replacedBy: replacedBy[i],
  }));
}

export type RoundCount = {
  round: string;
  applicants: number;
  incomplete: number;
  artworks: number;
  photos: number;
  mediaGuessed: number;
};

/** The distinct rounds, treating "March 27" and "march  27" as one (first spelling kept). */
export function listRounds(records: AirtableRecord[]): string[] {
  const byKey = new Map<string, string>();
  for (const round of records.map(roundOf).filter(Boolean)) {
    const key = round.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, round);
  }
  return [...byKey.values()];
}

/** Counts per round, for the connection check: no names or details. */
export function countRounds(records: AirtableRecord[]): RoundCount[] {
  return listRounds(records).map((round) => {
    const list = applicantsForRound(records, round).map((a) => a.applicant);
    const artworks = list.flatMap((a) => a.artworks);
    return {
      round,
      applicants: list.length,
      incomplete: list.filter(isIncomplete).length,
      artworks: artworks.length,
      photos: artworks.filter((a) => a.hasImage).length,
      mediaGuessed: artworks.filter((a) => a.mediumGuessed).length,
    };
  });
}
