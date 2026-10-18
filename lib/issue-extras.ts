/** Pieces of an issue shared by the email (lib/email.ts) and its web page (app/issues/[number]). */

/** The one-tap rating at the end of each issue. The vote counts on /feedback, after the reader confirms. */
export const RATINGS = [
  { key: "great", label: "Great" },
  { key: "fine", label: "Fine" },
  { key: "miss", label: "Not for me" },
] as const;

export type RatingKey = (typeof RATINGS)[number]["key"];

export const isRating = (value: unknown): value is RatingKey => RATINGS.some((r) => r.key === value);

export const feedbackPath = (issue: number, rating: RatingKey) => `/feedback?issue=${issue}&rating=${rating}`;

/** Who signs each issue off. */
export const SIGN_OFF = "Javier Díaz, Context Window";

const SEND_DAYS = [1, 3, 5]; // Monday, Wednesday, Friday

/** "Wednesday": the day the next issue goes out, after the one sent on `iso`. */
export function nextIssueDay(iso: string) {
  const day = new Date(iso).getUTCDay();
  const next = SEND_DAYS.find((d) => d > day) ?? SEND_DAYS[0];
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][next];
}
