// Matching a typed name to the committee list, so voters just type their
// name but the dashboard still knows who has and hasn't voted.
//
// The surname must match (ignoring case, spaces, hyphens and apostrophes);
// the first name may be exact, a short form ("Sue" for "Susan"), a nickname,
// or just start with the same letter. The closest first name wins; if two
// members are equally close, there's no match rather than a guess.

import type { CommitteeMember } from "./committee";

const NICKNAMES: Record<string, string[]> = {
  sue: ["susan", "suzanne", "susanne", "susie"],
  suzy: ["suzanne", "susan"],
  mike: ["michael"],
  mick: ["michael"],
  kate: ["katherine", "catherine", "kathryn", "kathleen"],
  kath: ["katherine", "catherine", "kathryn", "kathleen"],
  cathy: ["catherine", "cathryn"],
  jackie: ["jacqueline"],
  jacky: ["jacqueline"],
  deb: ["deborah", "debra"],
  debbie: ["deborah", "debra"],
  barb: ["barbara"],
  babs: ["barbara"],
  liz: ["elizabeth"],
  beth: ["elizabeth"],
  lis: ["elizabeth", "lisa"],
  bob: ["robert"],
  rob: ["robert"],
  bill: ["william"],
  will: ["william"],
  tony: ["anthony"],
  tom: ["thomas"],
  jim: ["james"],
  jen: ["jennifer"],
  jenny: ["jennifer"],
  chris: ["christopher", "christine", "christina"],
  pat: ["patricia", "patrick"],
  sam: ["samantha", "samuel"],
  di: ["diane", "diana"],
  maggie: ["margaret"],
  meg: ["margaret"],
  peggy: ["margaret"],
  annie: ["anne", "ann"],
  ann: ["anne"],
  anne: ["ann"],
};

/** Lower case, letters only (for surnames: "Wray-Jenkins" = "wray jenkins"). */
function squash(text: string): string {
  return (text ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
}

/** First word only, lower case: "Rachel E" -> "rachel". */
function firstWord(text: string): string {
  return squash((text ?? "").trim().split(/\s+/)[0] ?? "");
}

function splitMemberName(name: string): { first: string; surname: string } {
  const words = name.trim().split(/\s+/);
  return { first: words[0] ?? "", surname: words.slice(1).join(" ") || words[0] || "" };
}

/** How well two first names agree: 3 same, 2 short form or nickname, 1 same initial, 0 not at all. */
function firstNameScore(typed: string, official: string): number {
  if (!typed || !official) return 0;
  if (typed === official) return 3;
  if (typed.length >= 3 && official.length >= 3 && (official.startsWith(typed) || typed.startsWith(official))) return 2;
  if (NICKNAMES[typed]?.includes(official) || NICKNAMES[official]?.includes(typed)) return 2;
  return typed[0] === official[0] ? 1 : 0;
}

export type TypedName = { first: string; surname: string };

/** "alex" or "EXAMPLE" -> "Alex", "Example"; mixed case ("McLeod") is left alone. */
function tidyCase(text: string): string {
  if (/[a-z]/.test(text) && /[A-Z]/.test(text)) return text;
  return text.toLowerCase().replace(/(^|[\s\-'])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/** Tidy what the voter typed; if everything went in one box, split it. */
export function cleanTypedName(first: string, surname: string): TypedName {
  const f = tidyCase((first ?? "").replace(/\s+/g, " ").trim().slice(0, 60));
  const s = tidyCase((surname ?? "").replace(/\s+/g, " ").trim().slice(0, 60));
  if (!s && f.includes(" ")) {
    const words = f.split(" ");
    return { first: words.slice(0, -1).join(" "), surname: words.at(-1) ?? "" };
  }
  return { first: f, surname: s };
}

export function displayName({ first, surname }: TypedName): string {
  return `${first} ${surname}`.trim();
}

export function matchMember(typed: TypedName, members: CommitteeMember[]): CommitteeMember | null {
  const surname = squash(typed.surname);
  const first = firstWord(typed.first);
  if (!surname || !first) return null;

  const scored = members
    .filter((m) => squash(splitMemberName(m.name).surname) === surname)
    .map((m) => ({ m, score: firstNameScore(first, firstWord(splitMemberName(m.name).first)) }))
    .filter((c) => c.score > 0);
  if (scored.length === 0) return null;
  // Only the closest first-name matches count; a tie means we can't be sure.
  const best = Math.max(...scored.map((c) => c.score));
  const top = scored.filter((c) => c.score === best);
  return top.length === 1 ? top[0].m : null;
}
