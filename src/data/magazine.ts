export type MagazineSpread = {
  id: string;
  kicker: string;
  headline: string;
  dek?: string;
  body: string[];
  pullQuote?: string;
  folio: string;
};

export type MagazineIssue = {
  id: string;
  catalogId: string;
  masthead: string;
  issueLabel: string;
  brand: string;
  publishedAt: string;
  externalUrl: string;
  mode: "chapbook" | "dispatch" | "libellus";
  spreads: MagazineSpread[];
};

/**
 * Digital magazine issues mapped ONLY to Kendrick Tirrell Herring / Streetpolitik /
 * Kendrick-Kamau Negasi posts and publications — exact titles as published by you.
 */
export const MAGAZINE_ISSUES: MagazineIssue[] = [
  {
    id: "mag-qtoss-vol1",
    catalogId: "qtoss-vol1",
    masthead: "STREETPOLITIK",
    issueLabel: "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 1",
    brand: "Streetpolitik",
    publishedAt: "2013-05-24",
    externalUrl: "https://www.magcloud.com/user/streetpolitik",
    mode: "chapbook",
    spreads: [
      {
        id: "v1-cover",
        kicker: "CHAPBOOK · MAGCLOUD",
        headline: "EVIL …",
        dek: "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 1",
        body: [
          "poems old and new about myself and those around me which were intended for one book but instead were broken down into chapbooks.",
          "Published on MagCloud as Kendrick Herring (streetpolitik). Digest format. Print + digital editions.",
          "This magazine view is a digital reading room for the Streetpolitik chapbook lane — exact title preserved.",
        ],
        pullQuote: "i am something like Andy Kaufman + Doug Funnie fused together in one poet.",
        folio: "01",
      },
      {
        id: "v1-note",
        kicker: "AUTHOR NOTE",
        headline: "Street Statistic",
        body: [
          "A Streetpolitik™ imprint of quarantined thought — lyric as ledger, poem as pulse.",
          "Open the MagCloud shelf for the full print/digital chapbook.",
        ],
        folio: "02",
      },
    ],
  },
  {
    id: "mag-qtoss-vol2",
    catalogId: "qtoss-vol2",
    masthead: "STREETPOLITIK",
    issueLabel: "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 2",
    brand: "Streetpolitik",
    publishedAt: "2013-05-24",
    externalUrl: "https://www.magcloud.com/user/streetpolitik",
    mode: "chapbook",
    spreads: [
      {
        id: "v2-cover",
        kicker: "CHAPBOOK · MAGCLOUD",
        headline: "AWAKE…",
        dek: "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 2",
        body: [
          "Volume two of the quarantined chapbook sequence — Square 8\" × 8\" MagCloud edition.",
          "Same house. Same poet. Continued signal under Streetpolitik.",
        ],
        pullQuote: "#BeAutonomous",
        folio: "01",
      },
    ],
  },
  {
    id: "mag-pardon",
    catalogId: "tsol-pardon-their-illness",
    masthead: "TELLING SHOW OF LOVE",
    issueLabel: "DISPATCH · OCT 2025",
    brand: "Telling Show Of Love",
    publishedAt: "2025-10-01",
    externalUrl: "https://tellingshowoflove.substack.com/p/pardon-their-illness",
    mode: "dispatch",
    spreads: [
      {
        id: "pardon-1",
        kicker: "TSOL™ REBOOT",
        headline: "PARDON THEIR ILLNESS",
        dek: "Forgive them for they can't help what they hate to love",
        body: [
          "God, thank you. Amīn.",
          "once you realise people have serious insecurities & mental health issues they like to project onto you to justify doing irresponsible and unnecessary actions… Be grateful people go through extreme lengths just to try to be noticed by you or get a reaction.",
          "I don't forgive. Not care. But I can imagine what it might be like to not be as magnetic, magnificent, or powerful, beautiful and excellent as I Am, that I Am.",
        ],
        pullQuote: "I Am, that I Am.",
        folio: "01",
      },
    ],
  },
  {
    id: "mag-being-lame",
    catalogId: "tsol-being-lame",
    masthead: "TELLING SHOW OF LOVE",
    issueLabel: "DISPATCH · SEP 2025",
    brand: "Telling Show Of Love",
    publishedAt: "2025-09-12",
    externalUrl: "https://tellingshowoflove.substack.com",
    mode: "dispatch",
    spreads: [
      {
        id: "lame-1",
        kicker: "TSOL™",
        headline: "Being Lame For Free Is Wild!",
        dek: "i could never.",
        body: [
          "A sharp dispatch from the ongoing Telling Show Of Love™ reboot.",
          "Read the full post on Substack — magazine mode keeps you inside the house while you browse.",
        ],
        folio: "01",
      },
    ],
  },
  {
    id: "mag-final-notice",
    catalogId: "tsol-final-notice",
    masthead: "TELLING SHOW OF LOVE",
    issueLabel: "DISPATCH · AUG 2025",
    brand: "Telling Show Of Love",
    publishedAt: "2025-08-11",
    externalUrl: "https://tellingshowoflove.substack.com/p/final-notice",
    mode: "dispatch",
    spreads: [
      {
        id: "fn-1",
        kicker: "DRAFT FOUR",
        headline: "Final Notice: Libel City",
        body: [
          "Paper trail energy. City of libel, draft four.",
          "Full text lives on the Telling Show Of Love™ Substack uplink.",
        ],
        folio: "01",
      },
    ],
  },
  {
    id: "mag-reboot",
    catalogId: "tsol-reboot",
    masthead: "TELLING SHOW OF LOVE",
    issueLabel: "SEASON OPENER",
    brand: "Telling Show Of Love",
    publishedAt: "2025-08-06",
    externalUrl: "https://tellingshowoflove.substack.com",
    mode: "dispatch",
    spreads: [
      {
        id: "rb-1",
        kicker: "REBOOT",
        headline: "Reboot",
        dek: "OR CALL IT A NEW SEASON BUT NOT COMEBACK",
        body: [
          "New season protocol. Not a comeback — a continuation.",
          "Telling Show Of Love ™ reboot under Kendrick-Kamau Negasi / 357Itsumi.",
        ],
        folio: "01",
      },
    ],
  },
];

export function getMagazineByCatalogId(catalogId: string): MagazineIssue | undefined {
  return MAGAZINE_ISSUES.find((issue) => issue.catalogId === catalogId);
}

export function getMagazineIssue(id: string): MagazineIssue | undefined {
  return MAGAZINE_ISSUES.find((issue) => issue.id === id);
}

export const MAGAZINE_CATALOG_IDS = new Set(MAGAZINE_ISSUES.map((i) => i.catalogId));
