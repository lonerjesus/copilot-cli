/**
 * Public cosmogram chart — house identity only.
 * Legal / birth-certificate name is intentionally NOT exposed here.
 * Exact DOB used only for chart math (sun / life path); not shown as a DOB line.
 */
export const COSMO_PUBLIC = {
  /** Creative / house name shown on the chart */
  name: "Kendrick-Kamau Negasi",
  alsoKnownAs: [
    "Kamau Salaam Nasser",
    "Streetpolitik",
    "357Itsumi",
    "30over9",
  ] as const,
  sunSign: "Aries",
  lifePath: 7,
  birthdayNumber: 5,
} as const;

export const COSMOGRAM = {
  title: "COSMOGRAM · SIGNAL CHART",
  blurb:
    "Aries fire with Life Path 7 and Birthday 5 — sharp intuition paired with fearless motion. Sovereignty, communal love, and creative Black futurism without apology.",
  pillars: [
    {
      label: "Aries Fire",
      line: "First-strike brilliance — courage that opens doors and names the future out loud.",
    },
    {
      label: "Life Path 7",
      line: "Deep knowing turned into craft: study, insight, and spiritual clarity as creative power.",
    },
    {
      label: "Birthday 5",
      line: "Freedom as form — movement, remix, and magnetic range that keeps the culture in motion.",
    },
    {
      label: "Day Vibe",
      line: "Curiosity with backbone: adaptable excellence rooted in community and joy.",
    },
  ],
  affirmations: [
    "I lead with light and leave a path others can walk.",
    "My mind is a sanctuary of genius and grace.",
    "I move free, create bold, and stay sovereign.",
    "My excellence uplifts the whole circle.",
    "I am future-facing Black brilliance in motion.",
  ],
  vibeTags: [
    "sovereign",
    "pro-Black",
    "visionary",
    "community-rooted",
    "creative-fire",
    "futurist",
    "affirmed",
    "excellent",
    "#BeAutonomous",
  ],
  techPop: [
    { label: "Signal", line: "Terminal stream · autonomous portfolio OS" },
    { label: "Culture", line: "Street lyric · spoken word · vlog · remix" },
    {
      label: "Tech",
      line: "Bandcamp · SoundCloud · Slushy · Shazam · Rumble · MagCloud · Substack · Apple · Twitch · Vimeo",
    },
    { label: "House", line: "Streetpolitik · 357Itsumi · 30over9 · TSOL · GAK · GRUNGEzhou · Golden Crow" },
  ],
} as const;
