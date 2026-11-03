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

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const value = await store().get(key, { type: "json" });
  return (value as T | null) ?? fallback;
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await store().setJSON(key, value);
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
  await store().set(`image/${roundId}/${artworkId}`, bytes.buffer);
}

export async function getImage(roundId: string, artworkId: string): Promise<ArrayBuffer | null> {
  return store().get(`image/${roundId}/${artworkId}`, { type: "arrayBuffer" });
}
