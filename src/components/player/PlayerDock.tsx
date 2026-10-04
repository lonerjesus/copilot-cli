"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { kindGlyph } from "@/lib/format";
import { track } from "@/lib/analytics";
import { ContentPayActions } from "@/components/ContentPayActions";

function EmbedStage({
  provider,
  id,
  url,
  title,
}: {
  provider?: string;
  id?: string;
  url?: string;
  title: string;
}) {
  if (provider === "twitch" && id) {
    const src =
      `https://player.twitch.tv/?channel=${id}` +
      `&parent=www.kamaunegasi.net&parent=kamaunegasi.net&parent=localhost&muted=true`;
    return (
      <iframe title={title} src={src} allowFullScreen className="deck__frame" allow="autoplay; encrypted-media" />
    );
  }

  if (provider === "bandcamp" && id) {
    const src =
      `https://bandcamp.com/EmbeddedPlayer/album=${encodeURIComponent(id)}` +
      `/size=large/bgcol=0a0c0a/linkcol=b8ff3c/artwork=small/transparent=true/`;
    return (
      <iframe
        title={title}
        src={src}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media; clipboard-write"
        loading="lazy"
      />
    );
  }

  if (provider === "soundcloud" && url) {
    const src =
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
      `&color=%23b8ff3c&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    return (
      <iframe
        title={title}
        src={src}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media"
        loading="lazy"
      />
    );
  }

  if (provider === "vimeo" && url) {
    return (
      <div className="deck__fallback">
        <p>VIMEO UPLINK</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          open archive →
        </a>
      </div>
    );
  }

  // Bandcamp / audio without embed metadata — open source, no fake “playing”
  if (url && /bandcamp\.com/i.test(url)) {
    return (
      <div className="deck__fallback">
        <p>BANDCAMP UPLINK</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          open player on Bandcamp →
        </a>
      </div>
    );
  }

  return (
    <div className="deck__visual" aria-hidden>
      <div className="deck__orb" />
      <div className="deck__bars">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}

function RemoteMeta({ url, localTitle }: { url: string; localTitle: string }) {
  const [remoteTitle, setRemoteTitle] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { title?: string };
        if (alive && data.title) setRemoteTitle(data.title);
      } catch {
        /* keep local metadata */
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [url]);

  if (!remoteTitle || remoteTitle === localTitle) return null;
  return <p className="deck__sub">remote · {remoteTitle}</p>;
}

export function PlayerDock() {
  const {
    current,
    playing,
    expanded,
    progress,
    toggle,
    next,
    prev,
    setExpanded,
    setProgress,
  } = usePlayer();
  const { openMagazine, hasMagazine } = useMagazine();

  const label = useMemo(() => {
    if (!current) return "NO SIGNAL · enter stream";
    return `${current.brand} // ${current.title}`;
  }, [current]);

  return (
    <aside className={`deck ${expanded ? "deck--open" : ""}`} aria-label="Custom media player">
      <div className="deck__stage">
        {current ? (
          <EmbedStage
            provider={current.embed?.provider}
            id={current.embed?.id}
            url={current.embed?.url ?? current.externalUrl}
            title={current.title}
          />
        ) : (
          <div className="deck__visual" aria-hidden>
            <div className="deck__orb" />
          </div>
        )}
        <div className="deck__copy">
          {current ? (
            <>
              <p className="deck__eyebrow">
                {kindGlyph(current.kind)} {current.kind.toUpperCase()} · {current.platform}
              </p>
              <h2>{current.title}</h2>
              {current.subtitle ? <p className="deck__sub">{current.subtitle}</p> : null}
              <RemoteMeta key={current.id} url={current.externalUrl} localTitle={current.title} />
              <p className="deck__blurb">{current.blurb}</p>
              <a
                className="deck__external"
                href={current.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                fetch source post ↗
              </a>
              {hasMagazine(current.id) ? (
                <button
                  type="button"
                  className="deck__external deck__mag"
                  onClick={() => openMagazine(current.id)}
                >
                  open magazine view ▦
                </button>
              ) : null}
              <ContentPayActions catalogId={current.id} title={current.title} />
            </>
          ) : (
            <>
              <p className="deck__eyebrow">DECK IDLE</p>
              <h2>NO SIGNAL</h2>
              <p className="deck__blurb">Press enter stream to lock into the continuum.</p>
            </>
          )}
        </div>
      </div>

      <div className="deck__bar">
        <button
          type="button"
          className="deck__expand"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? "collapse" : "expand"}
        </button>
        <div className="deck__now">
          <span className={`deck__dot ${playing ? "is-live" : ""}`} />
          <span className="deck__label">{label}</span>
        </div>
        <div className="deck__controls">
          <button type="button" onClick={prev} aria-label="Previous">
            ⏮
          </button>
          <button
            type="button"
            className="deck__play"
            onClick={() => {
              if (!playing) track("play", { id: current?.id ?? "idle" });
              toggle();
            }}
            aria-label="Play pause"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              track("next", { id: current?.id ?? "idle" });
              next();
            }}
            aria-label="Next"
          >
            ⏭
          </button>
        </div>
        <label className="deck__scrub">
          <span className="sr-only">Progress</span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        </label>
      </div>
    </aside>
  );
}
