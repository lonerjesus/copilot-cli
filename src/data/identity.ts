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
  tagline: "autonomous portfolio · vlog · signal stream",
  description:
    "18+ only — not for people under 18 due to certain content. Interactive portfolio and vlog platform for Kendrick-Kamau Negasi — streaming footprint, custom media deck, and live social signal across Streetpolitik, GAK, TSOL, BLKDTY, and more.",
} as const;

export const PRIMARY_NAME = "Kendrick-Kamau Negasi";

export const ALIASES: Alias[] = [
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
    note: "podcast / imponderability stream",
  },
  { name: "357Itsumi", kind: "handle", note: "f/k/a Streetpolitik™ + LuxuryGuerrilla™" },
  { name: "LoveDrugVendingMachine", kind: "project" },
  { name: "GRUNGEzhou", kind: "brand", note: "GrungeZhou" },
  { name: "GRUNGEzhou Libellus", kind: "project" },
  { name: "GRUNGEzhou Supply", kind: "brand" },
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
