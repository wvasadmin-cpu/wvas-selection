// Which photos a publish or refresh still needs to copy. A photo already copied
// from the same Airtable attachment is left alone, so refreshing is quick.

export type PhotoSource = { artworkId: string; sourceId: string };

export function photosToCopy<T extends PhotoSource>(sources: T[], copied: Record<string, string> | undefined): T[] {
  return sources.filter((s) => copied?.[s.artworkId] !== s.sourceId);
}

/** The copied-photos record after a step: keeps only artworks still in the round. */
export function nextCopied(
  sources: PhotoSource[],
  previous: Record<string, string> | undefined,
  justCopied: PhotoSource[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const s of sources) {
    if (previous?.[s.artworkId] === s.sourceId) result[s.artworkId] = s.sourceId;
  }
  for (const s of justCopied) result[s.artworkId] = s.sourceId;
  return result;
}
