export type MediaKind = "video" | "audio" | "vlog" | "essay" | "still" | "live";

export type CatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  brand: string;
  kind: MediaKind;
  duration?: string;
  publishedAt: string;
  platform: string;
  externalUrl: string;
  /** Direct or embeddable media source when available */
  src?: string;
  poster?: string;
  embed?: {
    provider: "youtube" | "vimeo" | "twitch" | "soundcloud" | "substack" | "audio";
    id?: string;
    url?: string;
  };
  tags: string[];
  blurb: string;
};

export type StreamRow = {
  id: string;
  title: string;
  hint: string;
  itemIds: string[];
};

export const CATALOG: CatalogItem[] = [
  {
    id: "tsol-pardon-their-illness",
    title: "PARDON THEIR ILLNESS",
    subtitle: "Forgive them for they can't help what they hate to love",
    brand: "Telling Show Of Love",
    kind: "essay",
    publishedAt: "2025-10-01",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com/p/pardon-their-illness",
    tags: ["TSOL", "essay", "signal"],
    blurb: "Magnetic field notes from the TSOL reboot — projection, envy, and self-possession.",
  },
  {
    id: "tsol-being-lame",
    title: "Being Lame For Free Is Wild!",
    subtitle: "i could never.",
    brand: "Telling Show Of Love",
    kind: "essay",
    publishedAt: "2025-09-12",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com",
    tags: ["TSOL", "essay"],
    blurb: "A sharp dispatch from the ongoing Telling Show Of Love™ reboot.",
  },
  {
    id: "tsol-i-fret-not",
    title: "I Fret Not, Baby.",
    subtitle: "DADDY GONNA PULL UP UNWARRANTED SOON",
    brand: "Telling Show Of Love",
    kind: "vlog",
    publishedAt: "2025-08-21",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com",
    tags: ["TSOL", "vlog"],
    blurb: "Season energy — pull-up frequency logged.",
  },
  {
    id: "tsol-final-notice",
    title: "Final Notice: Libel City",
    subtitle: "Draft Four",
    brand: "Telling Show Of Love",
    kind: "essay",
    publishedAt: "2025-08-11",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com/p/final-notice",
    tags: ["TSOL", "essay"],
    blurb: "Paper trail energy. City of libel, draft four.",
  },
  {
    id: "tsol-celine",
    title: "Celine, Where Art Thou?",
    subtitle: "EPISODE ONE: RAMBLED INTO SOMETHING",
    brand: "Telling Show Of Love",
    kind: "audio",
    duration: "17:00",
    publishedAt: "2025-08-08",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com",
    embed: { provider: "audio", url: "https://tellingshowoflove.substack.com" },
    tags: ["TSOL", "Imponderabilia", "podcast"],
    blurb: "Imponderabilia transmission — wall carpet frequency opening.",
  },
  {
    id: "tsol-reboot",
    title: "Reboot",
    subtitle: "OR CALL IT A NEW SEASON BUT NOT COMEBACK",
    brand: "Telling Show Of Love",
    kind: "vlog",
    publishedAt: "2025-08-06",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com",
    tags: ["TSOL", "reboot"],
    blurb: "New season protocol. Not a comeback — a continuation.",
  },
  {
    id: "wall-carpet-235",
    title: "Imponderabilia: Wall_Carpet 235",
    subtitle: "Creating is the Ritual, Love is the Reason",
    brand: "Imponderabilia",
    kind: "audio",
    duration: "∞",
    publishedAt: "2024-08-24",
    platform: "substack",
    externalUrl: "https://tellingshowoflove.substack.com/podcast",
    tags: ["Imponderabilia", "Wall_Carpet", "podcast"],
    blurb: "The longform imprint behind TSOL — Faust Spirit Social Society production of imponderability.",
  },
  {
    id: "vimeo-jose-slim",
    title: "Jose Slim & SGM [Trailer]",
    brand: "357Itsumi",
    kind: "video",
    duration: "01:02",
    publishedAt: "2015-06-01",
    platform: "vimeo",
    externalUrl: "https://vimeo.com/streetpolitik",
    embed: { provider: "vimeo", url: "https://vimeo.com/streetpolitik" },
    tags: ["357Itsumi", "Streetpolitik", "trailer"],
    blurb: "Archive visual from the 357Itsumi / Streetpolitik vault.",
  },
  {
    id: "vimeo-tiponn",
    title: "Official TIPON&N Trailer",
    brand: "357Itsumi",
    kind: "video",
    duration: "01:34",
    publishedAt: "2015-06-01",
    platform: "vimeo",
    externalUrl: "https://vimeo.com/streetpolitik",
    embed: { provider: "vimeo", url: "https://vimeo.com/streetpolitik" },
    tags: ["357Itsumi", "film"],
    blurb: "St. Elsewhere transmission — TIPON&N visual.",
  },
  {
    id: "vimeo-thinking-of-you",
    title: "just thinking of you",
    brand: "Streetpolitik",
    kind: "video",
    duration: "01:18",
    publishedAt: "2011-05-01",
    platform: "vimeo",
    externalUrl: "https://vimeo.com/streetpolitik",
    tags: ["Streetpolitik", "archive"],
    blurb: "Early Streetpolitik visual diary.",
  },
  {
    id: "streetpolitik-toneden",
    title: "Streetpolitik™ Free Music",
    brand: "Streetpolitik",
    kind: "audio",
    publishedAt: "2012-01-01",
    platform: "toneden",
    externalUrl: "https://www.toneden.io/streetpolitk",
    tags: ["Streetpolitik", "BLKDTY", "audio"],
    blurb: "Free music node for the Streetpolitik™ catalog.",
  },
  {
    id: "twitch-live",
    title: "LIVE SIGNAL // kamaunegasi",
    subtitle: "Twitch uplink",
    brand: "Kamau Negasi",
    kind: "live",
    publishedAt: "2025-10-01",
    platform: "twitch",
    externalUrl: "https://www.twitch.tv/kamaunegasi",
    embed: { provider: "twitch", id: "kamaunegasi" },
    tags: ["live", "twitch", "vlog"],
    blurb: "Always-on stream node — drop in when the signal is hot.",
  },
  {
    id: "gak-manifest",
    title: "GrownAssKids // Manifest",
    subtitle: "GAK",
    brand: "GrownAssKids",
    kind: "vlog",
    publishedAt: "2024-01-15",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["GAK", "Grown Ass Kids", "brand"],
    blurb: "Grown Ass Kids brand channel — adult energy, kid curiosity.",
  },
  {
    id: "black-oh-my",
    title: "Black Oh-My",
    brand: "Black Oh-My",
    kind: "still",
    publishedAt: "2023-11-11",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["Black Oh-My", "visual"],
    blurb: "Visual brand frequency under the Negasi house.",
  },
  {
    id: "faust-fakeway",
    title: "Faust Fakeway",
    brand: "Faust Fakeway",
    kind: "audio",
    publishedAt: "2023-06-06",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["Faust Fakeway", "alias"],
    blurb: "Alias lane — Faust Fakeway transmissions.",
  },
  {
    id: "tl1-feed",
    title: "Thelonious1 / TL1",
    subtitle: "TheloniousOne",
    brand: "Thelonious1",
    kind: "essay",
    publishedAt: "2024-03-03",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["TL1", "Thelonious1", "handle"],
    blurb: "Handle stream for Thelonious1 — critic / maker / night notes.",
  },
  {
    id: "ldvm-drop",
    title: "LoveDrugVendingMachine",
    brand: "LoveDrugVendingMachine",
    kind: "audio",
    publishedAt: "2022-09-09",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["LoveDrugVendingMachine", "project"],
    blurb: "Insert coin. Dispense feeling. Project node online.",
  },
  {
    id: "telling-stills",
    title: "Telling Stills Of Love",
    brand: "Telling Stills Of Love",
    kind: "still",
    publishedAt: "2024-05-05",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["stills", "TSOL", "photo"],
    blurb: "Still-frame companion to Telling Show Of Love.",
  },
  {
    id: "blkdty-house",
    title: "BLKDTY Music LLC",
    brand: "BLKDTY Music LLC",
    kind: "audio",
    publishedAt: "2021-01-01",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["BLKDTY", "label"],
    blurb: "House label node — catalog stewardship under BLKDTY Music LLC.",
  },
  {
    id: "grungezhou-libellus",
    title: "GRUNGEzhou Libellus",
    brand: "GRUNGEzhou",
    kind: "essay",
    publishedAt: "2024-07-07",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["GRUNGEzhou", "Libellus", "GrungeZhou"],
    blurb: "Libellus node under GRUNGEzhou / GrungeZhou.",
  },
  {
    id: "grungezhou-supply",
    title: "GRUNGEzhou Supply",
    brand: "GRUNGEzhou Supply",
    kind: "still",
    publishedAt: "2024-08-08",
    platform: "web",
    externalUrl: "https://www.kamaunegasi.net",
    tags: ["GRUNGEzhou", "Supply", "GrungeZhou"],
    blurb: "Supply drop channel for the GRUNGEzhou house.",
  },
];

export const STREAM_ROWS: StreamRow[] = [
  {
    id: "now",
    title: "NOW PLAYING QUEUE",
    hint: "auto-advance · stay in the stream",
    itemIds: [
      "twitch-live",
      "tsol-pardon-their-illness",
      "tsol-celine",
      "wall-carpet-235",
      "tsol-i-fret-not",
    ],
  },
  {
    id: "tsol",
    title: "TELLING SHOW OF LOVE",
    hint: "essays · vlogs · reboot season",
    itemIds: [
      "tsol-pardon-their-illness",
      "tsol-being-lame",
      "tsol-i-fret-not",
      "tsol-final-notice",
      "tsol-celine",
      "tsol-reboot",
    ],
  },
  {
    id: "vault",
    title: "STREETPOLITIK / 357ITSUMI VAULT",
    hint: "archive video · free music",
    itemIds: [
      "vimeo-jose-slim",
      "vimeo-tiponn",
      "vimeo-thinking-of-you",
      "streetpolitik-toneden",
    ],
  },
  {
    id: "house",
    title: "HOUSE LABELS & ALIASES",
    hint: "GAK · BLKDTY · Faust · TL1 · LDVM",
    itemIds: [
      "gak-manifest",
      "blkdty-house",
      "faust-fakeway",
      "tl1-feed",
      "ldvm-drop",
      "black-oh-my",
      "telling-stills",
      "grungezhou-libellus",
      "grungezhou-supply",
    ],
  },
];

export function getItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getQueue(): CatalogItem[] {
  return STREAM_ROWS[0].itemIds
    .map((id) => getItem(id))
    .filter((item): item is CatalogItem => Boolean(item));
}
