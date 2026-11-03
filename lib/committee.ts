// The committee name list that voters pick from. Kept on the site's admin page
// (never in the code, as the repository is public). Each member has a fixed id
// so their votes stay attached if their name is later corrected.

export type CommitteeMember = { id: string; name: string };

export type CommitteeResult = { ok: true; members: CommitteeMember[] } | { ok: false; error: string };

export function cleanName(name: string): string {
  return (name ?? "").replace(/\s+/g, " ").trim();
}

export function sortMembers(members: CommitteeMember[]): CommitteeMember[] {
  return [...members].sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" }));
}

function nameTaken(members: CommitteeMember[], name: string, exceptId?: string): boolean {
  const lower = name.toLowerCase();
  return members.some((m) => m.id !== exceptId && m.name.toLowerCase() === lower);
}

export function addMember(members: CommitteeMember[], name: string, id: string): CommitteeResult {
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "Please enter a name." };
  if (clean.length > 80) return { ok: false, error: "That name is too long." };
  if (nameTaken(members, clean)) return { ok: false, error: `${clean} is already on the list.` };
  if (members.some((m) => m.id === id)) return { ok: false, error: "That id is already in use." };
  return { ok: true, members: sortMembers([...members, { id, name: clean }]) };
}

export function renameMember(members: CommitteeMember[], id: string, name: string): CommitteeResult {
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "Please enter a name." };
  if (clean.length > 80) return { ok: false, error: "That name is too long." };
  if (!members.some((m) => m.id === id)) return { ok: false, error: "That member wasn't found." };
  if (nameTaken(members, clean, id)) return { ok: false, error: `${clean} is already on the list.` };
  return { ok: true, members: sortMembers(members.map((m) => (m.id === id ? { ...m, name: clean } : m))) };
}

export function removeMember(members: CommitteeMember[], id: string): CommitteeResult {
  if (!members.some((m) => m.id === id)) return { ok: false, error: "That member wasn't found." };
  return { ok: true, members: members.filter((m) => m.id !== id) };
}
