export type Vote = "yes" | "no";

export type Artwork = {
  /** Stable id: `${applicantId}-${slot}`. */
  id: string;
  slot: number;
  title: string;
  medium: string;
  /** True when the medium was guessed from combined text and may need checking. */
  mediumGuessed: boolean;
  /** Whether a photo is available; artworks without one can't be voted on. */
  hasImage: boolean;
};

export type Applicant = {
  /** Airtable record id. */
  id: string;
  initials: string;
  /** Full name: shown only on the private admin pages. */
  fullName: string;
  bio: string;
  qualifications: string;
  otherMembership: string;
  artworks: Artwork[];
};

/** One committee member's answers for a round. */
export type Ballot = {
  memberId: string;
  attending: boolean;
  /** Keyed by artwork id. */
  votes: Record<string, Vote>;
  /** Keyed by applicant id. */
  feedback: Record<string, string>;
  updatedAt: string;
};
