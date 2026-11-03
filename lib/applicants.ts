// Turning Airtable records into applicants. Pure: no network, so it can be tested.

import { ARTWORK_SLOTS, FIELDS } from "./airtable-fields";
import { numberUntitled, splitTitleAndMedium } from "./artwork";
import { uniqueInitials } from "./initials";
import type { Applicant } from "./types";

export type AirtableAttachment = {
  url: string;
  filename?: string;
  type?: string;
  thumbnails?: { large?: { url: string }; full?: { url: string } };
};

export type AirtableRecord = { id: string; fields: Record<string, unknown> };

/** Where each artwork's photo can be fetched from (Airtable links expire after a few hours). */
export type ImageSource = { artworkId: string; url: string; filename: string };

export type ApplicantWithImages = { applicant: Applicant; images: ImageSource[] };

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

export function toApplicant(record: AirtableRecord, initials: string): ApplicantWithImages {
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
      images.push({ artworkId: id, url: attachment.url, filename: attachment.filename ?? `image-${slot}` });
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

/** All applicants in one round, in Airtable order, with unique initials. */
export function applicantsForRound(records: AirtableRecord[], round: string): ApplicantWithImages[] {
  const inRound = records.filter((r) => roundOf(r).toLowerCase() === round.trim().toLowerCase());
  const initials = uniqueInitials(
    inRound.map((r) => ({ firstName: text(r.fields[FIELDS.firstName]), surname: text(r.fields[FIELDS.surname]) })),
  );
  return inRound.map((r, i) => toApplicant(r, initials[i]));
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
