import "server-only";
import { getStore } from "@netlify/blobs";
import type { CommitteeMember } from "./committee";
import type { RoundCorrections } from "./corrections";
import { roundKey, summaryOf, type Round, type RoundSummary } from "./rounds";

// Site storage (Netlify Blobs): committee list, corrections, published rounds
// and their resized photos (votes to come). Strong consistency so a page reads
// what was just saved.

function store() {
  return getStore({ name: "wvas-selection", consistency: "strong" });
}

/** Fail with a clear error rather than leave a page hanging. */
function withTimeout<T>(promise: Promise<T>, what: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Storage didn't respond (${what}).`)), 10_000)),
  ]);
}

// Reading a key that doesn't exist never answers on Netlify, so check it
// exists first (that check answers straight away either way).
async function exists(key: string): Promise<boolean> {
  return (await withTimeout(store().getMetadata(key), `check ${key}`)) !== null;
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  if (!(await exists(key))) return fallback;
  const value = await withTimeout(store().get(key, { type: "json" }), `read ${key}`);
  return (value as T | null) ?? fallback;
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await withTimeout(store().setJSON(key, value), `save ${key}`);
}

// Committee
export const getCommittee = () => readJSON<CommitteeMember[]>("committee", []);
export const saveCommittee = (members: CommitteeMember[]) => writeJSON("committee", members);

// Corrections, by round name (they exist before a round is published)
export const getCorrections = (roundName: string) =>
  readJSON<RoundCorrections>(`corrections/${roundKey(roundName)}`, {});
export const saveCorrections = (roundName: string, corrections: RoundCorrections) =>
  writeJSON(`corrections/${roundKey(roundName)}`, corrections);

// Published rounds: a small index for listing, plus the full round by id
export const listPublishedRounds = () => readJSON<RoundSummary[]>("rounds", []);

export async function findPublishedRound(roundName: string): Promise<RoundSummary | null> {
  const key = roundKey(roundName);
  return (await listPublishedRounds()).find((r) => roundKey(r.name) === key) ?? null;
}

export const getRound = (id: string) => readJSON<Round | null>(`round/${id}`, null);

export async function saveRound(round: Round): Promise<void> {
  await writeJSON(`round/${round.id}`, round);
  const others = (await listPublishedRounds()).filter((r) => r.id !== round.id);
  await writeJSON("rounds", [...others, summaryOf(round)]);
}

// Resized photos, by round and artwork
export async function saveImage(roundId: string, artworkId: string, jpeg: Buffer): Promise<void> {
  const bytes = new Uint8Array(jpeg);
  await withTimeout(store().set(`image/${roundId}/${artworkId}`, bytes.buffer), "save photo");
}

export async function getImage(roundId: string, artworkId: string): Promise<ArrayBuffer | null> {
  const key = `image/${roundId}/${artworkId}`;
  if (!(await exists(key))) return null;
  return withTimeout(store().get(key, { type: "arrayBuffer" }), `read ${key}`);
}
