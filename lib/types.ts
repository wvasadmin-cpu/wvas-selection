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

/** One voter's answers for a round, stored per device (browser). */
export type Ballot = {
  /** Random id of the device the votes were made on. */
  voterId: string;
  /** The name as the voter typed it. */
  name: string;
  /** The committee member that name matched, or null if it didn't match anyone. */
  memberId: string | null;
  /** null until they've answered the attending question. */
  attending: boolean | null;
  /** Keyed by artwork id. */
  votes: Record<string, Vote>;
  /** Keyed by applicant id. */
  feedback: Record<string, string>;
  updatedAt: string;
};

/** The parts of a ballot that say what someone has answered. */
export type Answers = Pick<Ballot, "attending" | "votes" | "feedback">;
