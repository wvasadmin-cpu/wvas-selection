// Admin corrections laid over the Airtable data, so Airtable itself is never
// changed. Only values that differ from Airtable are stored, so a field put
// back to its original wording stops being a correction.

import type { Applicant } from "./types";

export type ArtworkCorrection = { title?: string; medium?: string };

export type ApplicantCorrection = {
  excluded?: boolean;
  bio?: string;
  qualifications?: string;
  otherMembership?: string;
  artworks?: Record<string, ArtworkCorrection>;
};

/** Corrections for one round, keyed by Airtable record id. */
export type RoundCorrections = Record<string, ApplicantCorrection>;

export type ApplicantEdits = {
  excluded: boolean;
  bio: string;
  qualifications: string;
  otherMembership: string;
  artworks: Record<string, { title: string; medium: string }>;
};

function clean(text: string): string {
  return (text ?? "").replace(/\r\n/g, "\n").trim();
}

/** Keep only what differs from the Airtable version. Returns null when nothing does. */
export function diffCorrection(base: Applicant, edits: ApplicantEdits): ApplicantCorrection | null {
  const result: ApplicantCorrection = {};
  if (edits.excluded) result.excluded = true;
  for (const key of ["bio", "qualifications", "otherMembership"] as const) {
    if (clean(edits[key]) !== clean(base[key])) result[key] = clean(edits[key]);
  }
  const artworks: Record<string, ArtworkCorrection> = {};
  for (const art of base.artworks) {
    const edit = edits.artworks[art.id];
    if (!edit) continue;
    const c: ArtworkCorrection = {};
    if (clean(edit.title) && clean(edit.title) !== art.title) c.title = clean(edit.title);
    if (clean(edit.medium) !== art.medium) c.medium = clean(edit.medium);
    if (Object.keys(c).length) artworks[art.id] = c;
  }
  if (Object.keys(artworks).length) result.artworks = artworks;
  return Object.keys(result).length ? result : null;
}

export function applyCorrection(applicant: Applicant, correction: ApplicantCorrection | undefined): Applicant {
  if (!correction) return applicant;
  return {
    ...applicant,
    bio: correction.bio ?? applicant.bio,
    qualifications: correction.qualifications ?? applicant.qualifications,
    otherMembership: correction.otherMembership ?? applicant.otherMembership,
    artworks: applicant.artworks.map((art) => {
      const c = correction.artworks?.[art.id];
      if (!c) return art;
      return {
        ...art,
        title: c.title ?? art.title,
        medium: c.medium ?? art.medium,
        // A medium typed in by the admin is no longer a guess.
        mediumGuessed: c.medium !== undefined ? false : art.mediumGuessed,
      };
    }),
  };
}

export function isExcluded(correction: ApplicantCorrection | undefined): boolean {
  return correction?.excluded === true;
}
