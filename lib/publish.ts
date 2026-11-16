import "server-only";
import { randomBytes } from "node:crypto";
import { fetchApplicationRecords } from "./airtable";
import { applicantsForRound, isIncomplete } from "./applicants";
import { applyCorrection, isExcluded } from "./corrections";
import { downloadAndResize } from "./images";
import { nextCopied, photosToCopy } from "./photo-plan";
import type { Round } from "./rounds";
import { getCorrections, getRound, saveImage, saveRound } from "./store";
import type { Applicant } from "./types";

// Netlify stops a request after about 26 seconds, so each step copies photos
// for at most this long; the admin page then runs further steps until done.
const PHOTO_TIME_BUDGET_MS = 10_000;
const PHOTOS_AT_ONCE = 4;

export type PublishStep = {
  round: Round;
  /** Photos that couldn't be copied this step (tried again on the next refresh). */
  photoProblems: number;
  /** Photos still waiting to be copied: run another step. */
  remaining: number;
  photosReady: number;
  photosTotal: number;
};

/**
 * One step of publishing or refreshing a round: rebuild it from Airtable plus
 * corrections and copy any new or changed photos, stopping in good time. With
 * an existing round id this is a refresh: the id (and so the link), status,
 * passcode and votes are kept.
 */
export async function publishStep(name: string, options: { passcode?: string; existingId?: string }): Promise<PublishStep> {
  const started = Date.now();
  const [records, corrections, existing] = await Promise.all([
    fetchApplicationRecords(),
    getCorrections(name),
    options.existingId ? getRound(options.existingId) : Promise.resolve(null),
  ]);

  const entries = applicantsForRound(records, name).filter(
    (e) => !isIncomplete(e.applicant) && !isExcluded(corrections[e.applicant.id]),
  );
  const id = existing?.id ?? randomBytes(18).toString("base64url");

  const sources = entries.flatMap((e) => e.images);
  const todo = photosToCopy(sources, existing?.photos);
  const copiedNow: typeof sources = [];
  const failed = new Set<string>();
  let attempted = 0;

  while (attempted < todo.length && Date.now() - started < PHOTO_TIME_BUDGET_MS) {
    const batch = todo.slice(attempted, attempted + PHOTOS_AT_ONCE);
    attempted += batch.length;
    await Promise.all(
      batch.map(async (photo) => {
        try {
          await saveImage(id, photo.artworkId, await downloadAndResize(photo.url));
          copiedNow.push(photo);
        } catch (err) {
          console.error(`Photo for ${photo.artworkId} failed`, err);
          failed.add(photo.artworkId);
        }
      }),
    );
  }

  const photos = nextCopied(sources, existing?.photos, copiedNow);

  const applicants: Applicant[] = entries.map(({ applicant }) => {
    const corrected = applyCorrection(applicant, corrections[applicant.id]);
    return {
      ...corrected,
      // Only show photos that are actually in storage and up to date.
      artworks: corrected.artworks.map((a) => ({ ...a, hasImage: a.hasImage && photos[a.id] !== undefined })),
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
    photos,
  };
  await saveRound(round);

  return {
    round,
    photoProblems: failed.size,
    remaining: todo.length - attempted,
    photosReady: Object.keys(photos).length,
    photosTotal: sources.length,
  };
}
