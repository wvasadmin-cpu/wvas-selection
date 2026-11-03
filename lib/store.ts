import "server-only";
import { getStore } from "@netlify/blobs";
import type { CommitteeMember } from "./committee";

// Site storage (Netlify Blobs). Holds the committee list now; rounds, photos
// and votes to come. Strong consistency so a page reads what was just saved.

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

export const getCommittee = () => readJSON<CommitteeMember[]>("committee", []);
export const saveCommittee = (members: CommitteeMember[]) => writeJSON("committee", members);
