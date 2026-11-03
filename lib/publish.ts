import "server-only";
import { randomBytes } from "node:crypto";
import { fetchApplicationRecords } from "./airtable";
import { applicantsForRound, isIncomplete } from "./applicants";
import { applyCorrection, isExcluded } from "./corrections";
import { downloadAndResize, inBatches } from "./images";
import type { Round } from "./rounds";
import { getCorrections, getRound, saveImage, saveRound } from "./store";
import type { Applicant } from "./types";

export type PublishResult = { round: Round; photoProblems: number };

/**
 * Build a round from Airtable plus corrections and store it with its photos.
 * With an existing round id this is a refresh: the id (and so the link),
 * status, passcode and votes are kept.
 */
export async function publishRound(name: string, options: { passcode?: string; existingId?: string }): Promise<PublishResult> {
  const [records, corrections, existing] = await Promise.all([
    fetchApplicationRecords(),
    getCorrections(name),
    options.existingId ? getRound(options.existingId) : Promise.resolve(null),
  ]);

  const entries = applicantsForRound(records, name).filter(
    (e) => !isIncomplete(e.applicant) && !isExcluded(corrections[e.applicant.id]),
  );

  const id = existing?.id ?? randomBytes(18).toString("base64url");

  // Download and resize every photo; one failing doesn't stop the rest.
  const failed = new Set<string>();
  const photos = entries.flatMap((e) => e.images);
  await inBatches(photos, 6, async (photo) => {
    try {
      await saveImage(id, photo.artworkId, await downloadAndResize(photo.url));
    } catch (err) {
      console.error(`Photo for ${photo.artworkId} failed`, err);
      failed.add(photo.artworkId);
    }
  });

  const applicants: Applicant[] = entries.map(({ applicant }) => {
    const corrected = applyCorrection(applicant, corrections[applicant.id]);
    return {
      ...corrected,
      artworks: corrected.artworks.map((a) => ({ ...a, hasImage: a.hasImage && !failed.has(a.id) })),
    };
  });

  const now = new Date().toISOString();
  const round: Round = {
    id,
    name: existing?.name ?? name,
    status: existing?.status ?? "open",
    passcode: existing?.passcode ?? options.passcode ?? "",
    publishedAt: existing?.publishedAt ?? now,
    refreshedAt: now,
    applicantCount: applicants.length,
    applicants,
  };
  await saveRound(round);
  return { round, photoProblems: failed.size };
}
