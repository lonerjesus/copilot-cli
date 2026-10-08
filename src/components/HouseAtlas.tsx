"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import { SITE } from "@/data/identity";
import {
  ATLAS,
  HOUSE_BRANDS,
  HOUSE_OUTLETS,
  HOUSE_PROJECTS,
  outletById,
  primaryOutlets,
  type HouseOutlet,
  type HouseProject,
  type OutletLane,
} from "@/data/connections";
import {
  GITHUB_TOOLS,
  GITHUB_TOOLS_COUNT,
  GITHUB_TOOLS_SOURCE,
  type GithubTool,
} from "@/data/github-tools";
import type { ArchiveItem } from "@/lib/archive-bridge";
import { BrandMark } from "@/components/BrandMark";
import { track } from "@/lib/analytics";

type PanelId = "outlets" | "projects" | "archive" | "marks" | "stack";

const PANELS: { id: PanelId; label: string }[] = [
  { id: "outlets", label: "outlets" },
  { id: "projects", label: "projects" },
  { id: "archive", label: "archive" },
  { id: "marks", label: "marks" },
  { id: "stack", label: "stack" },
];

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

function projectTouchesLane(project: HouseProject, lane: OutletLane | "all"): boolean {
  if (lane === "all") return true;
  if (!project.outletIds.length) return lane === "web";
  return project.outletIds.some((id) => outletById(id)?.lane === lane);
}

function panelFromHash(): PanelId {
  if (typeof window === "undefined") return "outlets";
  const id = window.location.hash.replace(/^#/, "").toLowerCase();
  if (id === "stack" || id === "projects" || id === "archive" || id === "marks") {
    return id;
  }
  return "outlets";
}

export function HouseAtlas({ compact = false }: { compact?: boolean }) {
  const baseId = useId();
  const [panel, setPanel] = useState<PanelId>("outlets");
  const [lane, setLane] = useState<OutletLane | "all">("all");
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [archiveState, setArchiveState] = useState<"loading" | "ready" | "quiet" | "error">(
    "loading",
  );
  const panelTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const laneTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const apply = () => {
      const next = panelFromHash();
      startTransition(() => setPanel(next));
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch("/api/connections", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) {
          setArchiveState("error");
          return;
        }
        const data = (await res.json()) as { archive?: ArchiveItem[] };
        const items = data.archive ?? [];
        setArchive(items);
        setArchiveState(items.length ? "ready" : "quiet");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setArchiveState("error");
      }
    };
    void run();
    return () => controller.abort();
  }, []);

  const outlets = useMemo(() => {
    if (lane === "all") return HOUSE_OUTLETS;
    return HOUSE_OUTLETS.filter((o) => o.lane === lane);
  }, [lane]);

  const featured = useMemo(() => {
    if (lane !== "all") return [];
    return primaryOutlets();
  }, [lane]);

  const listOutlets = useMemo(() => {
    if (!featured.length) return outlets;
    const featuredIds = new Set(featured.map((o) => o.id));
    return outlets.filter((o) => !featuredIds.has(o.id));
  }, [outlets, featured]);

  const projects = useMemo(
    () => HOUSE_PROJECTS.filter((p) => projectTouchesLane(p, lane)),
    [lane],
  );

  const brands = useMemo(
    () => HOUSE_BRANDS.filter((b) => b.kind !== "legal"),
    [],
  );

  const goPanel = useCallback((id: PanelId) => {
    startTransition(() => setPanel(id));
    if (typeof window === "undefined") return;
    const nextHash =
      id === "stack" || id === "projects" || id === "archive" || id === "marks"
        ? id
        : "house";
    if (window.location.hash.replace(/^#/, "") !== nextHash) {
      window.history.replaceState(null, "", `#${nextHash}`);
    }
  }, []);

  const goLane = useCallback((id: OutletLane | "all") => {
    startTransition(() => setLane(id));
  }, []);

  const onTabListKey = useCallback(
    (
      event: KeyboardEvent<HTMLDivElement>,
      items: readonly { id: string }[],
      current: string,
      setCurrent: (id: string) => void,
      refs: MutableRefObject<Array<HTMLButtonElement | null>>,
    ) => {
      const idx = items.findIndex((item) => item.id === current);
      if (idx < 0) return;
      let next = idx;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = (idx + 1) % items.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (idx - 1 + items.length) % items.length;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = items.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      const id = items[next]?.id;
      if (!id) return;
      setCurrent(id);
      refs.current[next]?.focus();
    },
    [],
  );

  return (
    <section
      className={`section atlas ${compact ? "section--compact" : ""}`}
      aria-label="House"
    >
      <header className="atlas__hero">
        <div className="atlas__hero-atmosphere" aria-hidden>
          <div className="atlas__hero-grid" />
          <div className="atlas__hero-orb atlas__hero-orb--a" />
          <div className="atlas__hero-orb atlas__hero-orb--b" />
          <div className="atlas__hero-wash" />
        </div>
        <div className="atlas__hero-inner">
          <BrandMark size={80} className="atlas__mark" />
          <p className="atlas__eyebrow">{ATLAS.eyebrow}</p>
          <h2 className="atlas__title">{SITE.title}</h2>
          <p className="atlas__line">{ATLAS.line}</p>
          <div className="atlas__cta">
            <a
              href="#stream"
              className="atlas__cta-primary"
              onClick={() => {
                track("enter_stream", { via: "atlas_hero" });
                if (window.location.hash !== "#stream") {
                  window.location.hash = "stream";
                } else {
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                }
              }}
            >
              enter stream
            </a>
            <button
              type="button"
              className="atlas__cta-ghost"
              onClick={() => goPanel("archive")}
            >
              archive bridge
            </button>
          </div>
        </div>
      </header>

      <div
        className="atlas__panels"
        role="tablist"
        aria-label="House panels"
        onKeyDown={(e) =>
          onTabListKey(e, PANELS, panel, (id) => goPanel(id as PanelId), panelTabRefs)
        }
      >
        {PANELS.map((p, i) => {
          const selected = panel === p.id;
          return (
            <button
              key={p.id}
              ref={(el) => {
                panelTabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-panel-${p.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-panel-${p.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "is-active" : undefined}
              onClick={() => goPanel(p.id)}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {(panel === "outlets" || panel === "projects") && (
        <div
          className="atlas__lanes"
          role="tablist"
          aria-label="Outlet lanes"
          onKeyDown={(e) =>
            onTabListKey(
              e,
              LANES,
              lane,
              (id) => goLane(id as OutletLane | "all"),
              laneTabRefs,
            )
          }
        >
          {LANES.map((l, i) => {
            const selected = lane === l.id;
            return (
              <button
                key={l.id}
                ref={(el) => {
                  laneTabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-lane-${l.id}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={selected ? "is-active" : undefined}
                onClick={() => goLane(l.id)}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      )}

      {panel === "outlets" ? (
        <div
          className="atlas__block atlas__block--outlets"
          role="tabpanel"
          id={`${baseId}-panel-panel-outlets`}
          aria-labelledby={`${baseId}-panel-outlets`}
        >
          <header className="atlas__block-head">
            <h3>OUTLETS</h3>
            <span>{outlets.length}</span>
          </header>
          {featured.length ? (
            <ul className="atlas__featured" aria-label="Primary outlets">
              {featured.map((outlet, i) => (
                <OutletRow key={outlet.id} outlet={outlet} index={i} featured />
              ))}
            </ul>
          ) : null}
          {listOutlets.length ? (
            <ul className="atlas__outlet-list">
              {listOutlets.map((outlet, i) => (
                <OutletRow key={outlet.id} outlet={outlet} index={i} />
              ))}
            </ul>
          ) : (
            <p className="atlas__empty">Nothing in this lane. Pick another lane above.</p>
          )}
        </div>
      ) : null}

      {panel === "projects" ? (
        <div
          className="atlas__block"
          role="tabpanel"
          id={`${baseId}-panel-panel-projects`}
          aria-labelledby={`${baseId}-panel-projects`}
        >
          <header className="atlas__block-head">
            <h3>PROJECTS</h3>
            <span>{projects.length}</span>
          </header>
          {projects.length ? (
            <ul className="atlas__project-list">
              {projects.map((project, i) => (
                <ProjectRow key={project.id} project={project} index={i} />
              ))}
            </ul>
          ) : (
            <p className="atlas__empty">No projects in this lane. Pick another lane above.</p>
          )}
        </div>
      ) : null}

      {panel === "archive" ? (
        <div
          className="atlas__block"
          role="tabpanel"
          id={`${baseId}-panel-panel-archive`}
          aria-labelledby={`${baseId}-panel-archive`}
        >
          <header className="atlas__block-head">
            <h3>ARCHIVE BRIDGE</h3>
            <span>
              {archiveState === "loading"
                ? "…"
                : archiveState === "ready"
                  ? archive.length
                  : "0"}
            </span>
          </header>
          <p className="atlas__aside">
            MagCloud chapbooks + live Substack — kept off the stream shelves on purpose.
          </p>
          {archiveState === "loading" ? (
            <ul className="atlas__archive-list atlas__archive-list--pulse" aria-hidden>
              {[0, 1, 2].map((n) => (
                <li key={n} className="atlas__skeleton" />
              ))}
            </ul>
          ) : archiveState === "error" ? (
            <p className="atlas__empty">
              Archive bridge offline. Wait ~30 seconds, then open archive again.
            </p>
          ) : archiveState === "quiet" ? (
            <p className="atlas__empty">No archive items right now. Check outlets or stack.</p>
          ) : (
            <ul className="atlas__archive-list">
              {archive.map((item, i) => (
                <li
                  key={item.id}
                  className={item.poster ? "has-poster" : undefined}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      track("enter_stream", { id: item.id, via: "atlas_archive" })
                    }
                  >
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="atlas__archive-poster"
                        src={item.poster}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="atlas__archive-glyph" aria-hidden>
                        {item.source === "magcloud" ? "◇" : "◈"}
                      </span>
                    )}
                    <span className="atlas__archive-copy">
                      <span className="atlas__archive-source">{item.sourceLabel}</span>
                      <strong>{item.title}</strong>
                      {item.summary ? (
                        <em className="atlas__archive-summary">{item.summary}</em>
                      ) : null}
                      <span className="atlas__archive-meta">{item.publishedAt}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {panel === "marks" ? (
        <div
          className="atlas__block atlas__block--brands"
          role="tabpanel"
          id={`${baseId}-panel-panel-marks`}
          aria-labelledby={`${baseId}-panel-marks`}
        >
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
      ) : null}

      {panel === "stack" ? (
        <div
          className="atlas__block atlas__block--stack"
          role="tabpanel"
          id={`${baseId}-panel-panel-stack`}
          aria-labelledby={`${baseId}-panel-stack`}
        >
          <header className="atlas__block-head">
            <h3>STACK</h3>
            <span>
              {GITHUB_TOOLS.length}/{GITHUB_TOOLS_COUNT}
            </span>
          </header>
          <p className="atlas__aside">
            Open a row to leave for GitHub. Rows marked local are installed under{" "}
            <code>agents/skills</code>. Source: {GITHUB_TOOLS_SOURCE}.
          </p>
          <ul className="atlas__outlet-list" aria-label="GitHub tools">
            {[...GITHUB_TOOLS]
              .sort((a, b) => Number(b.verdict === "vendored") - Number(a.verdict === "vendored"))
              .map((tool, i) => (
                <StackRow key={tool.id} tool={tool} index={i} />
              ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function OutletRow({
  outlet,
  index,
  featured = false,
}: {
  outlet: HouseOutlet;
  index: number;
  featured?: boolean;
}) {
  return (
    <li
      className={`atlas__outlet ${laneTone(outlet.lane)}${featured ? " atlas__outlet--featured" : ""}`}
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

function StackRow({ tool, index }: { tool: GithubTool; index: number }) {
  const lane = tool.verdict === "vendored" ? "local" : "github";
  return (
    <li
      className={`atlas__outlet ${tool.verdict === "vendored" ? "atlas-lane--writing" : "atlas-lane--web"}`}
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("enter_stream", { id: tool.id, via: "atlas_stack" })}
      >
        <span className="atlas__outlet-lane">{lane}</span>
        <span className="atlas__outlet-body">
          <strong>
            {tool.name}
            {tool.verdict === "vendored" ? " · skill" : ""}
          </strong>
          <em>
            {tool.repo} — {tool.blurb}
            {tool.localSkill ? ` · ${tool.localSkill}` : ""}
          </em>
        </span>
        <span className="atlas__outlet-go" aria-hidden>
          ↗
        </span>
      </a>
    </li>
  );
}

function outletChip(outlet: HouseOutlet): string {
  const head = outlet.label.split(/[·/]/)[0]?.trim() ?? "";
  if (head && head.length <= 18) return head;
  if (outlet.id.startsWith("bandcamp")) return "Bandcamp";
  if (outlet.id.startsWith("apple")) return "Apple";
  if (outlet.id.startsWith("twitch")) return "Twitch";
  if (outlet.id.startsWith("shazam")) return "Shazam";
  if (outlet.id === "magcloud-archive") return "MagCloud";
  return outlet.lane;
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
              title={o.label}
              onClick={() => track("enter_stream", { id: o.id, via: "atlas_project" })}
            >
              {outletChip(o)}
            </a>
          ))}
        </div>
      ) : (
        <span className="atlas__project-idle">house-only</span>
      )}
    </li>
  );
}
