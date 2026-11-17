// The current exhibitor application intake: which round new applications go
// into, when applications close, and the viewing day details shown on the form.

export type Intake = {
  /** Written to "Date of Submission", e.g. "March 27". */
  roundName: string;
  /** Last day applications are accepted (YYYY-MM-DD, UK time). */
  closesOn: string;
  /** Free text, e.g. "Monday 1st February 2027 in the Ballroom at Stamford Arts Centre, PE9 2DL". */
  viewing: string;
  /** Lets the admin close applications early. */
  open: boolean;
};

export type IntakeStatus = "open" | "closed" | "not-set";

/** Today's date in the UK as YYYY-MM-DD. */
export function ukToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Applications are accepted up to the end of the closing day, UK time. */
export function intakeStatus(intake: Intake | null, now = new Date()): IntakeStatus {
  if (!intake || !intake.roundName || !/^\d{4}-\d{2}-\d{2}$/.test(intake.closesOn)) return "not-set";
  if (!intake.open) return "closed";
  return ukToday(now) <= intake.closesOn ? "open" : "closed";
}

/** "2027-01-15" -> "Friday 15 January 2027". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const part = (o: Intl.DateTimeFormatOptions) => date.toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
  return `${part({ weekday: "long" })} ${d} ${part({ month: "long" })} ${y}`;
}
