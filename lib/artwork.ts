// Turning what applicants type into a tidy title and medium.
//
// Older applications have title and medium typed into one box in all sorts of
// ways ("BEETHOVEN ACRYLIC ON CANVAS", "Michigan Winter. Watercolour on paper",
// "Splash!  - mixed media, acrylic"). When the separate Medium field is filled
// in we use it; otherwise we make a best guess, which the admin can correct in
// the preview.

const MEDIUM_WORDS = new Set([
  "acrylic", "acrylics", "oil", "oils", "watercolour", "watercolours", "watercolor",
  "watercolors", "gouache", "tempera", "encaustic", "pastel", "pastels", "chalk",
  "charcoal", "graphite", "pencil", "pencils", "pen", "ink", "inks", "crayon",
  "collage", "mixed", "media", "canvas", "board", "paper", "panel", "wood", "card",
  "linen", "stitched", "stitch", "textile", "textiles", "embroidery", "print",
  "prints", "printmaking", "monoprint", "monotype", "linocut", "lino", "etching",
  "screenprint", "woodcut", "photograph", "photography", "digital", "giclee",
  "ceramic", "ceramics", "clay", "bronze", "glass", "resin", "sculpture", "fluid",
]);

// Words allowed inside a medium description between the medium words.
const CONNECTOR_WORDS = new Set(["on", "and", "with", "&", "/", "in"]);

const UNTITLED = /^(no title|untitled|none|n\/a)$/i;

export type SplitArtwork = {
  title: string;
  medium: string;
  /** True when the medium was guessed from the combined text. */
  guessed: boolean;
};

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Strip separators left at either end ("High Water-", ". Canvas"), keeping ! and ?. */
function trimSeparators(text: string): string {
  return text.replace(/^[\s\-–—.,:;]+/, "").replace(/[\s\-–—.,:;]+$/, "");
}

function bareWord(token: string): string {
  return token.toLowerCase().replace(/^[^a-z&/]+|[^a-z&/]+$/g, "");
}

/** "BEETHOVEN" -> "Beethoven"; text with any lower-case letters is left alone. */
export function tidyTitle(raw: string): string {
  const text = trimSeparators(collapseSpaces(raw));
  if (!/[a-z]/.test(text) && /[A-Z]/.test(text)) {
    return text.toLowerCase().replace(/(^|[\s\-–(])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
  }
  return text;
}

/** "ACRYLIC ON CANVAS" or "Mixed Media stitched Collage" -> "Acrylic on canvas", "Mixed media stitched collage". */
export function tidyMedium(raw: string): string {
  const text = trimSeparators(collapseSpaces(raw)).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isUntitled(title: string): boolean {
  return title === "" || UNTITLED.test(trimSeparators(title));
}

/**
 * Find where the medium starts in combined text: the earliest medium word from
 * which every remaining word is a medium word or a connector.
 */
function findMediumStart(tokens: string[]): number {
  let start = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const word = bareWord(tokens[i]);
    if (MEDIUM_WORDS.has(word)) start = i;
    else if (CONNECTOR_WORDS.has(word) && start !== -1) continue;
    else break;
  }
  // A medium can't begin with a connector ("on canvas" belongs to "Acrylic on canvas").
  while (start !== -1 && start < tokens.length && CONNECTOR_WORDS.has(bareWord(tokens[start]))) start++;
  return start;
}

export function splitTitleAndMedium(artworkText: string, mediumText: string): SplitArtwork {
  const artwork = collapseSpaces(artworkText ?? "");
  const medium = collapseSpaces(mediumText ?? "");

  if (medium) {
    return { title: tidyTitle(artwork), medium: tidyMedium(medium), guessed: false };
  }

  const tokens = artwork.split(" ").filter(Boolean);
  const start = findMediumStart(tokens);
  if (start === -1) {
    return { title: tidyTitle(artwork), medium: "", guessed: true };
  }
  return {
    title: tidyTitle(tokens.slice(0, start).join(" ")),
    medium: tidyMedium(tokens.slice(start).join(" ")),
    guessed: true,
  };
}

/**
 * Give untitled works a display name: "Untitled" when there is one,
 * "Untitled 1", "Untitled 2"... when an applicant has several.
 */
export function numberUntitled(titles: string[]): string[] {
  const untitledCount = titles.filter(isUntitled).length;
  let n = 0;
  return titles.map((title) => {
    if (!isUntitled(title)) return title;
    n++;
    return untitledCount > 1 ? `Untitled ${n}` : "Untitled";
  });
}
