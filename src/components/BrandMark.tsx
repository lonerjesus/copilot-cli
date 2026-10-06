"use client";

import { SITE } from "@/data/identity";

export type BrandTone = "phosphor" | "light" | "ink";

const SRC: Record<BrandTone, string> = {
  phosphor: "/logo-kn-phosphor.png",
  light: "/logo-kn-light.png",
  ink: "/logo-kn.png",
};

type BrandMarkProps = {
  tone?: BrandTone;
  className?: string;
  size?: number;
  priority?: boolean;
  decorative?: boolean;
};

/** Pixel Kamau Negasi mark — black source turned phosphor/light for dark UI. */
export function BrandMark({
  tone = "phosphor",
  className = "",
  size = 40,
  priority = false,
  decorative = false,
}: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public brand mark
    <img
      src={SRC[tone]}
      alt={decorative ? "" : SITE.title}
      width={size}
      height={size}
      className={`brand-mark ${className}`.trim()}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      draggable={false}
      aria-hidden={decorative || undefined}
    />
  );
}

/** Soft brand watermark for shell backgrounds. */
export function BrandWatermark({
  tone = "phosphor",
  className = "",
}: {
  tone?: BrandTone;
  className?: string;
}) {
  return (
    <div className={`brand-watermark ${className}`.trim()} aria-hidden>
      <BrandMark tone={tone} size={280} decorative className="brand-watermark__mark" />
    </div>
  );
}
