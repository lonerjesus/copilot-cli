/** Personal cosmogram math from an ISO birth date (YYYY-MM-DD). */

export type PersonalChart = {
  displayName: string;
  birthDate: string;
  sunSign: string;
  lifePath: number;
  birthdayNumber: number;
};

const SUN_RANGES: Array<{ sign: string; start: [number, number]; end: [number, number] }> = [
  { sign: "Capricorn", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", start: [2, 19], end: [3, 20] },
  { sign: "Aries", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", start: [6, 21], end: [7, 22] },
  { sign: "Leo", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", start: [8, 23], end: [9, 22] },
  { sign: "Libra", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", start: [11, 22], end: [12, 21] },
];

function digitSum(n: number): number {
  let x = Math.abs(n);
  while (x > 9) {
    x = String(x)
      .split("")
      .reduce((a, d) => a + Number(d), 0);
  }
  return x;
}

export function parseBirthDate(raw: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m: mo, d };
}

/** Age in full years as of `asOf` (UTC). */
export function ageFromBirthDate(iso: string, asOf = new Date()): number | null {
  const parsed = parseBirthDate(iso);
  if (!parsed) return null;
  let age = asOf.getUTCFullYear() - parsed.y;
  const beforeBirthday =
    asOf.getUTCMonth() + 1 < parsed.m ||
    (asOf.getUTCMonth() + 1 === parsed.m && asOf.getUTCDate() < parsed.d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function assertAdultBirthDate(iso: string): string {
  const parsed = parseBirthDate(iso);
  if (!parsed) throw new Error("Birth date must be YYYY-MM-DD");
  const age = ageFromBirthDate(iso);
  if (age == null || age < 18) throw new Error("You must be 18 or older");
  if (age > 120) throw new Error("Birth date looks invalid");
  return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
}

export function sunSignFor(m: number, d: number): string {
  for (const row of SUN_RANGES) {
    const [sm, sd] = row.start;
    const [em, ed] = row.end;
    if (sm <= em) {
      if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)) {
        return row.sign;
      }
    } else {
      // Capricorn wraps year
      if ((m === sm && d >= sd) || (m === em && d <= ed) || m > sm || m < em) {
        return row.sign;
      }
    }
  }
  return "Aries";
}

export function buildPersonalChart(displayName: string, birthDate: string): PersonalChart {
  const iso = assertAdultBirthDate(birthDate);
  const parsed = parseBirthDate(iso)!;
  const lifePath = digitSum(parsed.y + parsed.m + parsed.d);
  const birthdayNumber = digitSum(parsed.d);
  return {
    displayName: displayName.trim() || "member",
    birthDate: iso,
    sunSign: sunSignFor(parsed.m, parsed.d),
    lifePath,
    birthdayNumber,
  };
}

export const CHART_COPY = {
  title: "YOUR COSMOGRAM",
  blurbFor: (sign: string, life: number, day: number) =>
    `${sign} fire with Life Path ${life} and Birthday ${day} — a personal signal chart for your stream session. Affirmations stay sovereign and pro-Black.`,
  pillars: (sign: string, life: number, day: number) => [
    {
      label: `${sign} Current`,
      line: "Your solar tone — lead with the courage and clarity that date already coded in.",
    },
    {
      label: `Life Path ${life}`,
      line: "The long arc of your craft: study, insight, and creative power without apology.",
    },
    {
      label: `Birthday ${day}`,
      line: "Day-number motion — how you remix freedom into form on the stream.",
    },
    {
      label: "House Rule",
      line: "This chart is yours alone. Legal names stay off the glass.",
    },
  ],
  affirmations: [
    "I lead with light and leave a path others can walk.",
    "My mind is a sanctuary of genius and grace.",
    "I move free, create bold, and stay sovereign.",
    "My excellence uplifts the whole circle.",
    "I am future-facing Black brilliance in motion.",
  ],
} as const;
