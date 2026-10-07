/** Inline SVG menu icons — image-like glyphs for rail / admin chrome. */

type IconProps = {
  className?: string;
  title?: string;
};

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function IconStream({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBrowse({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
    </svg>
  );
}

export function IconSupport({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
    </svg>
  );
}

export function IconAdmin({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6" />
    </svg>
  );
}

export function IconCompose({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0 0-3L18.5 4.5a2.1 2.1 0 0 0-3 0L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function IconLibrary({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4z" />
      <path d="M7 4v16" />
      <path d="M10 9h5M10 13h5" />
    </svg>
  );
}

export function IconAnalytics({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15v-4M12 15V8M16 15v-7" />
    </svg>
  );
}

export function IconData({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v12" />
      <path d="M7 12l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function IconVideo({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="13" height="12" rx="1.5" />
      <path d="M16 10.5l5-2.5v8l-5-2.5v-3z" />
    </svg>
  );
}

export function IconPhoto({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3 16l5-4 4 3 3-2 6 3" />
    </svg>
  );
}

export function IconMusic({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18a2.5 2.5 0 1 1-2-2.45V7.5l12-2v9.2a2.5 2.5 0 1 1-2-2.45" />
    </svg>
  );
}

export function IconNote({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4" />
      <path d="M10 12h6M10 16h4" />
    </svg>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M7 10.5V20h10v-9.5" />
    </svg>
  );
}
