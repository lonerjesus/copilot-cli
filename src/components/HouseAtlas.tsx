"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE } from "@/data/identity";
import {
  ATLAS,
  HOUSE_BRANDS,
  HOUSE_OUTLETS,
  HOUSE_PROJECTS,
  outletById,
  type HouseOutlet,
  type HouseProject,
  type OutletLane,
} from "@/data/connections";
import type { ArchiveItem } from "@/lib/archive-bridge";
import { BrandMark } from "@/components/BrandMark";
import { track } from "@/lib/analytics";

const LANES: { id: OutletLane | "all"; label: string }[] = [
  { id: "all", label: "all" },
  { id: "writing", label: "writing" },
  { id: "audio", label: "audio" },
  { id: "video", label: "video" },
  { id: "live", label: "live" },
  { id: "archive", label: "archive" },
  { id: "web", label: "web" },
];

function laneTone(lane: OutletLane): string {
  switch (lane) {
    case "writing":
      return "atlas-lane--writing";
    case "audio":
      return "atlas-lane--audio";
    case "video":
      return "atlas-lane--video";
    case "live":
      return "atlas-lane--live";
    case "archive":
      return "atlas-lane--archive";
    default:
      return "atlas-lane--web";
  }
}

export function HouseAtlas({ compact = false }: { compact?: boolean }) {
  const [lane, setLane] = useState<OutletLane | "all">("all");
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch("/api/connections", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { archive?: ArchiveItem[] };
        if (data.archive?.length) setArchive(data.archive);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      } finally {
        setLoaded(true);
      }
    };
    void run();
    return () => controller.abort();
  }, []);

  const outlets = useMemo(() => {
    if (lane === "all") return HOUSE_OUTLETS;
    return HOUSE_OUTLETS.filter((o) => o.lane === lane);
  }, [lane]);

  const projects = HOUSE_PROJECTS;
  const brands = HOUSE_BRANDS.filter((b) => b.kind !== "legal");

  return (
    <section
      className={`section atlas ${compact ? "section--compact" : ""}`}
      aria-label="House"
    >
      <header className="atlas__hero">
        <div className="atlas__hero-atmosphere" aria-hidden>
          <div className="atlas__hero-grid" />
          <div className="atlas__hero-wash" />
        </div>
        <div className="atlas__hero-inner">
          <BrandMark size={72} className="atlas__mark" />
          <p className="atlas__eyebrow">{ATLAS.eyebrow}</p>
          <h2 className="atlas__title">{SITE.title}</h2>
          <p className="atlas__line">{ATLAS.line}</p>
        </div>
      </header>

      <div className="atlas__lanes" role="tablist" aria-label="Outlet lanes">
        {LANES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lane === l.id}
            className={lane === l.id ? "is-active" : undefined}
            onClick={() => setLane(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="atlas__block atlas__block--outlets">
        <header className="atlas__block-head">
          <h3>OUTLETS</h3>
          <span>{outlets.length}</span>
        </header>
        <ul className="atlas__outlet-list">
          {outlets.map((outlet, i) => (
            <OutletRow key={outlet.id} outlet={outlet} index={i} />
          ))}
        </ul>
      </div>

      <div className="atlas__block">
        <header className="atlas__block-head">
          <h3>PROJECTS</h3>
          <span>{projects.length}</span>
        </header>
        <ul className="atlas__project-list">
          {projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </ul>
      </div>

      <div className="atlas__block">
        <header className="atlas__block-head">
          <h3>ARCHIVE BRIDGE</h3>
          <span>{loaded ? archive.length : "…"}</span>
        </header>
        <p className="atlas__aside">
          MagCloud chapbooks + live Substack — outside the stream shelves on purpose.
        </p>
        {loaded && archive.length === 0 ? (
          <p className="atlas__empty">Archive feeds quiet right now.</p>
        ) : (
          <ul className="atlas__archive-list">
            {archive.map((item, i) => (
              <li key={item.id} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("enter_stream", { id: item.id, via: "atlas_archive" })}
                >
                  <span className="atlas__archive-source">{item.sourceLabel}</span>
                  <strong>{item.title}</strong>
                  <span className="atlas__archive-meta">{item.publishedAt}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="atlas__block atlas__block--brands">
        <header className="atlas__block-head">
          <h3>MARKS</h3>
          <span>{brands.length}</span>
        </header>
        <ul className="atlas__brand-strip" aria-label="House marks">
          {brands.map((b) => (
            <li key={b.name}>
              <span>{b.short ?? b.name}</span>
              <em>{b.kind}</em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function OutletRow({ outlet, index }: { outlet: HouseOutlet; index: number }) {
  return (
    <li
      className={`atlas__outlet ${laneTone(outlet.lane)}`}
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <a
        href={outlet.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("enter_stream", { id: outlet.id, via: "atlas_outlet" })}
      >
        <span className="atlas__outlet-lane">{outlet.lane}</span>
        <span className="atlas__outlet-body">
          <strong>{outlet.label}</strong>
          <em>{outlet.blurb}</em>
        </span>
        <span className="atlas__outlet-go" aria-hidden>
          ↗
        </span>
      </a>
    </li>
  );
}

function ProjectRow({ project, index }: { project: HouseProject; index: number }) {
  const links = project.outletIds
    .map((id) => outletById(id))
    .filter((o): o is HouseOutlet => Boolean(o));

  return (
    <li
      className="atlas__project"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <div className="atlas__project-main">
        <p className="atlas__project-kind">{project.kind}</p>
        <h4>
          {project.name}
          {project.short ? <span> · {project.short}</span> : null}
        </h4>
        <p>{project.blurb}</p>
      </div>
      {links.length ? (
        <div className="atlas__project-links">
          {links.map((o) => (
            <a
              key={o.id}
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("enter_stream", { id: o.id, via: "atlas_project" })}
            >
              {o.lane}
            </a>
          ))}
        </div>
      ) : (
        <span className="atlas__project-idle">house-only</span>
      )}
    </li>
  );
}
