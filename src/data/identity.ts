export type Alias = {
  name: string;
  short?: string;
  kind: "legal" | "artist" | "brand" | "project" | "handle" | "entity";
  note?: string;
};

export const SITE = {
  domain: "www.kamaunegasi.net",
  url: "https://www.kamaunegasi.net",
  title: "KAMAU NEGASI",
  tagline: "portfolio · vlog · stream",
  description:
    "18+ only. Portfolio and vlog platform for Kendrick-Kamau Negasi.",
} as const;

export const PRIMARY_NAME = "Kendrick-Kamau Negasi";

/** Legal / birth identity — spelled exactly as provided */
export const BIRTH_NAME = "Kendrick Tirrell Herring";
export const DOB = "04/05/1987";

export const ALIASES: Alias[] = [
  { name: "Kendrick Tirrell Herring", kind: "legal", note: "DOB 04/05/1987" },
  { name: "Kendrick-Kamau Negasi", kind: "legal" },
  { name: "Kamau Salaam Nasser", kind: "legal" },
  { name: "Streetpolitik", kind: "artist", note: "f/k/a core music identity" },
  { name: "Faust Fakeway", kind: "artist" },
  { name: "GrownAssKids", short: "GAK", kind: "brand", note: "Grown Ass Kids" },
  { name: "Black Oh-My", kind: "brand" },
  { name: "BLKDTY Music LLC", kind: "entity" },
  { name: "Kendrick-Kamau Negasi LLC", kind: "entity" },
  { name: "Thelonious1", short: "TL1", kind: "handle", note: "TheloniousOne" },
  {
    name: "Telling Show Of Love",
    short: "TSOL",
    kind: "project",
    note: "TellingShowOfLove",
  },
  { name: "Telling Stills Of Love", kind: "project" },
  {
    name: "Imponderabilia: Wall_Carpet 235",
    kind: "project",
    note: "imponderabilia: wall_carpet #235",
  },
  { name: "357Itsumi", kind: "handle", note: "f/k/a Streetpolitik™" },
  { name: "LoveDrugVendingMachine", kind: "project" },
  { name: "GRUNGEzhou", kind: "brand", note: "GrungeZhou" },
  { name: "GRUNGEzhou Libellus", kind: "project" },
  { name: "GRUNGEzhou Supply", kind: "brand" },
  { name: "Golden Crow", kind: "brand" },
  { name: "Golden Crow Acquisitions", kind: "entity" },
  {
    name: "QUARANTINED THOUGHTS OF A STREET STATISTIC",
    kind: "project",
    note: "MagCloud chapbooks · Streetpolitik",
  },
  {
    name: "STPK's Smoker's Lounge Music",
    kind: "project",
    note: "Apple Podcasts · Streetpolitik™",
  },
  {
    name: "Telling Songs As Content",
    kind: "project",
    note: "Bandcamp album · 357Itsumi",
  },
  {
    name: "30over9",
    kind: "brand",
    note: "30over9 Presents: Good;Sloppy.",
  },
  {
    name: "Good;Sloppy.",
    kind: "project",
    note: "30over9 · Bandcamp",
  },
];

export const PLATFORMS = [
  {
    id: "substack",
    label: "Substack / TSOL",
    handle: "tellingshowoflove",
    url: "https://tellingshowoflove.substack.com",
    feed: "https://tellingshowoflove.substack.com/feed",
    kind: "blog" as const,
  },
  {
    id: "magcloud",
    label: "MagCloud",
    handle: "streetpolitik",
    url: "https://www.magcloud.com/user/streetpolitik",
    kind: "magazine" as const,
  },
  {
    id: "bandcamp",
    label: "Bandcamp · 357Itsumi",
    handle: "357itsumi",
    url: "https://357itsumi.bandcamp.com",
    kind: "audio" as const,
  },
  {
    id: "bandcamp-30over9",
    label: "Bandcamp · 30over9 / Good;Sloppy.",
    handle: "357itsumi",
    url: "https://357itsumi.bandcamp.com/album/30over9-presents-good-sloppy",
    kind: "audio" as const,
  },
  {
    id: "soundcloud",
    label: "SoundCloud · 357Itsumi",
    handle: "357itsumi",
    url: "https://m.soundcloud.com/357itsumi",
    kind: "audio" as const,
  },
  {
    id: "slushy",
    label: "Slushy · 357Itsumi",
    handle: "357Itsumi",
    url: "https://www.slushy.com/357Itsumi",
    kind: "audio" as const,
  },
  {
    id: "shazam-357",
    label: "Shazam · 357Itsumi",
    handle: "357Itsumi",
    url: "https://www.shazam.com/artist/-/1776608082",
    kind: "audio" as const,
  },
  {
    id: "shazam-streetpolitik",
    label: "Shazam · Streetpolitik",
    handle: "Streetpolitik",
    url: "https://www.shazam.com/artist/-/1188877723",
    kind: "audio" as const,
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "357Itsumi",
    url: "https://www.facebook.com/profile.php?id=61566165809486",
    kind: "web" as const,
  },
  {
    id: "rumble",
    label: "Rumble · 357Itsumi",
    handle: "357Itsumi",
    url: "https://rumble.com/user/357Itsumi",
    kind: "video" as const,
  },
  {
    id: "apple-imponderabilia",
    label: "Apple · Imponderabilia: Wall_Carpet 235",
    handle: "imponderabilia",
    url: "https://podcasts.apple.com/us/podcast/imponderabilia-wall-carpet-235/id1831912721",
    kind: "audio" as const,
  },
  {
    id: "apple-stpks",
    label: "Apple · STPK's Smoker's Lounge Music",
    handle: "streetpolitik",
    url: "https://podcasts.apple.com/us/podcast/stpks-smokers-lounge-music/id1110276220",
    kind: "audio" as const,
  },
  {
    id: "twitch",
    label: "Twitch",
    handle: "kamaunegasi",
    url: "https://www.twitch.tv/kamaunegasi",
    kind: "stream" as const,
  },
  {
    id: "vimeo",
    label: "Vimeo",
    handle: "streetpolitik",
    url: "https://vimeo.com/streetpolitik",
    kind: "video" as const,
  },
  {
    id: "toneden",
    label: "ToneDen",
    handle: "streetpolitk",
    url: "https://www.toneden.io/streetpolitk",
    kind: "audio" as const,
  },
  {
    id: "web",
    label: "KamauNegasi.me",
    handle: "kamaunegasi",
    url: "https://www.kamaunegasi.me",
    kind: "web" as const,
  },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];
