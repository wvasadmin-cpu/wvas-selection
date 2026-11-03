// Applicants appear to judges by initials only ("RB"). If two applicants in a
// round share initials, later ones get a number ("RB 2").

function firstLetter(text: string): string {
  const match = (text ?? "").match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : "";
}

export function initialsFor(firstName: string, surname: string): string {
  return firstLetter(firstName) + firstLetter(surname) || "?";
}

/** Initials for a whole round, in the order given, made unique. */
export function uniqueInitials(people: { firstName: string; surname: string }[]): string[] {
  const seen = new Map<string, number>();
  return people.map(({ firstName, surname }) => {
    const base = initialsFor(firstName, surname);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} ${count}`;
  });
}
