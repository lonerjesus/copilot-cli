export type CategoryId =
  | "writing"
  | "audio"
  | "video"
  | "vlog"
  | "visuals"
  | "house";

export type SubcategoryId =
  | "essays"
  | "libellus"
  | "criticism"
  | "music"
  | "podcast"
  | "experiments"
  | "trailers"
  | "archive"
  | "live"
  | "season"
  | "brand-channels"
  | "stills"
  | "supply"
  | "brand-art"
  | "labels"
  | "brands"
  | "handles"
  | "projects"
  | "entities";

export type Subcategory = {
  id: SubcategoryId;
  label: string;
  keywords: string[];
};

export type Category = {
  id: CategoryId;
  label: string;
  hint: string;
  keywords: string[];
  subcategories: Subcategory[];
};

export const CATEGORIES: Category[] = [
  {
    id: "writing",
    label: "WRITING",
    hint: "essays · libellus · criticism",
    keywords: ["writing", "text", "essay", "substack", "read"],
    subcategories: [
      {
        id: "essays",
        label: "Essays",
        keywords: ["essay", "tsol", "telling show of love", "substack"],
      },
      {
        id: "libellus",
        label: "Libellus",
        keywords: ["libellus", "grungezhou", "grungezhou libellus"],
      },
      {
        id: "criticism",
        label: "Criticism",
        keywords: ["criticism", "tl1", "thelonious1", "theloniousone"],
      },
    ],
  },
  {
    id: "audio",
    label: "AUDIO",
    hint: "music · podcast · experiments",
    keywords: ["audio", "music", "sound", "listen", "podcast"],
    subcategories: [
      {
        id: "music",
        label: "Music",
        keywords: ["music", "streetpolitik", "blkdty", "toneden", "faust"],
      },
      {
        id: "podcast",
        label: "Podcast",
        keywords: ["podcast", "imponderabilia", "wall_carpet", "wall carpet", "tsol"],
      },
      {
        id: "experiments",
        label: "Experiments",
        keywords: ["experiments", "lovedrugvendingmachine", "ldvm"],
      },
    ],
  },
  {
    id: "video",
    label: "VIDEO",
    hint: "trailers · archive · live",
    keywords: ["video", "film", "vimeo", "watch"],
    subcategories: [
      {
        id: "trailers",
        label: "Trailers",
        keywords: ["trailer", "357itsumi", "tipon"],
      },
      {
        id: "archive",
        label: "Archive",
        keywords: ["archive", "streetpolitik", "vimeo"],
      },
      {
        id: "live",
        label: "Live",
        keywords: ["live", "twitch", "stream"],
      },
    ],
  },
  {
    id: "vlog",
    label: "VLOG",
    hint: "season · brand channels",
    keywords: ["vlog", "diary", "reboot"],
    subcategories: [
      {
        id: "season",
        label: "Season",
        keywords: ["season", "reboot", "tsol", "telling show of love"],
      },
      {
        id: "brand-channels",
        label: "Brand Channels",
        keywords: ["brand", "gak", "grownasskids", "grown ass kids"],
      },
    ],
  },
  {
    id: "visuals",
    label: "VISUALS",
    hint: "stills · supply · brand art",
    keywords: ["visuals", "photo", "still", "image"],
    subcategories: [
      {
        id: "stills",
        label: "Stills",
        keywords: ["stills", "telling stills of love", "photo"],
      },
      {
        id: "supply",
        label: "Supply",
        keywords: ["supply", "grungezhou supply", "grungezhou"],
      },
      {
        id: "brand-art",
        label: "Brand Art",
        keywords: ["brand art", "black oh-my", "black oh my"],
      },
    ],
  },
  {
    id: "house",
    label: "HOUSE",
    hint: "labels · brands · handles · entities",
    keywords: ["house", "identity", "brand", "alias", "label", "llc"],
    subcategories: [
      {
        id: "labels",
        label: "Labels",
        keywords: ["label", "blkdty", "blkdty music"],
      },
      {
        id: "brands",
        label: "Brands",
        keywords: ["brands", "gak", "grungezhou", "black oh-my"],
      },
      {
        id: "handles",
        label: "Handles",
        keywords: ["handle", "tl1", "thelonious1", "357itsumi"],
      },
      {
        id: "projects",
        label: "Projects",
        keywords: ["project", "tsol", "ldvm", "imponderabilia"],
      },
      {
        id: "entities",
        label: "Entities",
        keywords: ["entity", "llc", "kendrick-kamau negasi llc"],
      },
    ],
  },
];

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getSubcategory(
  categoryId: CategoryId,
  subcategoryId: SubcategoryId,
): Subcategory | undefined {
  return getCategory(categoryId)?.subcategories.find((s) => s.id === subcategoryId);
}

export function findCategoryByQuery(query: string): {
  category?: Category;
  subcategory?: Subcategory;
} {
  const q = query.trim().toLowerCase();
  if (!q) return {};

  for (const category of CATEGORIES) {
    for (const sub of category.subcategories) {
      if (
        sub.id === q ||
        sub.label.toLowerCase() === q ||
        sub.keywords.some((k) => k === q || q.includes(k) || k.includes(q))
      ) {
        return { category, subcategory: sub };
      }
    }
    if (
      category.id === q ||
      category.label.toLowerCase() === q ||
      category.keywords.some((k) => k === q || q.includes(k) || k.includes(q))
    ) {
      return { category };
    }
  }

  return {};
}
