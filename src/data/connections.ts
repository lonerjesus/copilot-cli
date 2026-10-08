/**
 * House atlas — projects + outlets for incorporation into kamaunegasi.net.
 * Exact spellings only (see agents/ROSTER.md / identity ALIASES).
 */

import { ALIASES, PLATFORMS, SITE, type Alias } from "@/data/identity";

export type OutletLane = "writing" | "audio" | "video" | "live" | "web" | "archive";

export type HouseOutlet = {
  id: string;
  label: string;
  handle: string;
  url: string;
  lane: OutletLane;
  blurb: string;
  primary?: boolean;
};

export type HouseProject = {
  id: string;
  name: string;
  short?: string;
  kind: Alias["kind"];
  blurb: string;
  outletIds: string[];
};

/** Curated outlets — includes bridges missing from the old thin platform list. */
export const HOUSE_OUTLETS: HouseOutlet[] = [
  {
    id: "substack",
    label: "Substack / TSOL",
    handle: "tellingshowoflove",
    url: "https://tellingshowoflove.substack.com",
    lane: "writing",
    blurb: "Telling Show Of Love ™ reboot — notes & episodes",
    primary: true,
  },
  {
    id: "bandcamp",
    label: "Bandcamp · 357Itsumi",
    handle: "357itsumi",
    url: "https://357itsumi.bandcamp.com",
    lane: "audio",
    blurb: "House music drops",
    primary: true,
  },
  {
    id: "bandcamp-30over9",
    label: "30over9 Presents: Good;Sloppy.",
    handle: "357itsumi",
    url: "https://357itsumi.bandcamp.com/album/30over9-presents-good-sloppy",
    lane: "audio",
    blurb: "30over9 · Good;Sloppy.",
  },
  {
    id: "soundcloud",
    label: "SoundCloud · 357Itsumi",
    handle: "357itsumi",
    url: "https://m.soundcloud.com/357itsumi",
    lane: "audio",
    blurb: "Audio experiments & mixes",
  },
  {
    id: "youtube",
    label: "YouTube · Kamau Negasi",
    handle: "KamauNegasi",
    url: "https://www.youtube.com/@KamauNegasi",
    lane: "video",
    blurb: "Video archive & trailers",
    primary: true,
  },
  {
    id: "vimeo",
    label: "Vimeo · 357Itsumi",
    handle: "streetpolitik",
    url: "https://vimeo.com/streetpolitik",
    lane: "video",
    blurb: "Streetpolitik / 357Itsumi film rack",
  },
  {
    id: "rumble",
    label: "Rumble · 357Itsumi",
    handle: "357Itsumi",
    url: "https://rumble.com/user/357Itsumi",
    lane: "video",
    blurb: "Alternate video uplink",
  },
  {
    id: "twitch",
    label: "Twitch · kamaunegasi",
    handle: "kamaunegasi",
    url: "https://www.twitch.tv/kamaunegasi",
    lane: "live",
    blurb: "Live stream",
    primary: true,
  },
  {
    id: "twitch-faust",
    label: "Twitch · FaustSociety",
    handle: "FaustSociety",
    url: "https://www.twitch.tv/FaustSociety",
    lane: "live",
    blurb: "Faust Spirit Social Society live",
  },
  {
    id: "apple-imponderabilia",
    label: "Apple · Imponderabilia: Wall_Carpet 235",
    handle: "imponderabilia",
    url: "https://podcasts.apple.com/us/podcast/imponderabilia-wall-carpet-235/id1831912721",
    lane: "audio",
    blurb: "Podcast · Wall_Carpet 235",
  },
  {
    id: "apple-stpks",
    label: "Apple · STPK's Smoker's Lounge Music",
    handle: "streetpolitik",
    url: "https://podcasts.apple.com/us/podcast/stpks-smokers-lounge-music/id1110276220",
    lane: "audio",
    blurb: "Streetpolitik™ lounge archive",
  },
  {
    id: "slushy",
    label: "Slushy · 357Itsumi",
    handle: "357Itsumi",
    url: "https://www.slushy.com/357Itsumi",
    lane: "audio",
    blurb: "Distribution outlet",
  },
  {
    id: "shazam-357",
    label: "Shazam · 357Itsumi",
    handle: "357Itsumi",
    url: "https://www.shazam.com/artist/-/1776608082",
    lane: "audio",
    blurb: "Shazam artist node",
  },
  {
    id: "shazam-streetpolitik",
    label: "Shazam · Streetpolitik",
    handle: "Streetpolitik",
    url: "https://www.shazam.com/artist/-/1188877723",
    lane: "audio",
    blurb: "Legacy Streetpolitik Shazam",
  },
  {
    id: "toneden",
    label: "ToneDen",
    handle: "streetpolitk",
    url: "https://www.toneden.io/streetpolitk",
    lane: "audio",
    blurb: "Streetpolitik ToneDen node",
  },
  {
    id: "facebook",
    label: "Facebook · 357Itsumi",
    handle: "357Itsumi",
    url: "https://www.facebook.com/profile.php?id=61566165809486",
    lane: "web",
    blurb: "Public page",
  },
  {
    id: "faust-spirit",
    label: "Faust Spirit Social Society Inc.",
    handle: "faustspirit",
    url: "https://faustspiritsocialsocietyincorp.godaddysites.com/",
    lane: "web",
    blurb: "Society hub (rebuilding)",
  },
  {
    id: "magcloud-archive",
    label: "MagCloud · streetpolitik",
    handle: "streetpolitik",
    url: "https://www.magcloud.com/user/streetpolitik",
    lane: "archive",
    blurb: "QUARANTINED THOUGHTS OF A STREET STATISTIC archive",
  },
  {
    id: "magcloud-qtoss-vol1",
    label: "MagCloud · QTOASS Vol.1",
    handle: "streetpolitik",
    url: "https://www.magcloud.com/browse/issue/665683",
    lane: "archive",
    blurb: "Chapbook Vol.1 — archive link-out only",
  },
  {
    id: "magcloud-qtoss-vol2",
    label: "MagCloud · QTOASS Vol.2",
    handle: "streetpolitik",
    url: "https://www.magcloud.com/browse/issue/672460",
    lane: "archive",
    blurb: "Chapbook Vol.2 — archive link-out only",
  },
  {
    id: "web-me",
    label: "KamauNegasi.me",
    handle: "kamaunegasi",
    url: "https://www.kamaunegasi.me",
    lane: "archive",
    blurb: "Parked legacy domain — prefer www.kamaunegasi.net",
  },
];

export const HOUSE_PROJECTS: HouseProject[] = [
  {
    id: "tsol",
    name: "Telling Show Of Love",
    short: "TSOL",
    kind: "project",
    blurb: "Reboot notes, episodes, and the love ritual.",
    outletIds: ["substack", "twitch", "youtube"],
  },
  {
    id: "telling-stills",
    name: "Telling Stills Of Love",
    kind: "project",
    blurb: "Still photography lane under the house.",
    outletIds: [],
  },
  {
    id: "imponderabilia",
    name: "Imponderabilia: Wall_Carpet 235",
    kind: "project",
    blurb: "Podcast dungeon — Apple uplink live.",
    outletIds: ["apple-imponderabilia"],
  },
  {
    id: "stpks-lounge",
    name: "STPK's Smoker's Lounge Music",
    kind: "project",
    blurb: "Streetpolitik™ lounge music archive.",
    outletIds: ["apple-stpks"],
  },
  {
    id: "good-sloppy",
    name: "Good;Sloppy.",
    kind: "project",
    blurb: "30over9 Presents — Bandcamp album.",
    outletIds: ["bandcamp-30over9"],
  },
  {
    id: "telling-songs",
    name: "Telling Songs As Content",
    kind: "project",
    blurb: "Bandcamp album · 357Itsumi.",
    outletIds: ["bandcamp"],
  },
  {
    id: "ldvm",
    name: "LoveDrugVendingMachine",
    kind: "project",
    blurb: "Experiments lane.",
    outletIds: ["soundcloud"],
  },
  {
    id: "grungezhou-libellus",
    name: "GRUNGEzhou Libellus",
    kind: "project",
    blurb: "Libellus under the GRUNGEzhou mark.",
    outletIds: [],
  },
  {
    id: "qtoss",
    name: "QUARANTINED THOUGHTS OF A STREET STATISTIC",
    kind: "project",
    blurb: "Chapbook archive on MagCloud — house reprint optional.",
    outletIds: ["magcloud-archive", "magcloud-qtoss-vol1", "magcloud-qtoss-vol2"],
  },
  {
    id: "faust-society",
    name: "Faust Spirit Social Society Inc.",
    kind: "entity",
    blurb: "Society production node — Twitch FaustSociety.",
    outletIds: ["faust-spirit", "twitch-faust", "youtube"],
  },
];

export const HOUSE_BRANDS = ALIASES.filter((a) =>
  a.kind === "brand" || a.kind === "entity" || a.kind === "artist" || a.kind === "handle",
);

export function outletsByLane(lane: OutletLane): HouseOutlet[] {
  return HOUSE_OUTLETS.filter((o) => o.lane === lane);
}

export function primaryOutlets(): HouseOutlet[] {
  return HOUSE_OUTLETS.filter((o) => o.primary);
}

export function outletById(id: string): HouseOutlet | undefined {
  return HOUSE_OUTLETS.find((o) => o.id === id);
}

/** Keep PLATFORMS in identity as the legacy ingest list; atlas owns the full map. */
export function legacyPlatformCount(): number {
  return PLATFORMS.length;
}

export const ATLAS = {
  title: SITE.title,
  eyebrow: "HOUSE",
  line: "Outlets, projects, archive, and stack under one mark. Pick a panel below.",
} as const;
