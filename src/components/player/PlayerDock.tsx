"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { kindGlyph } from "@/lib/format";
import { track } from "@/lib/analytics";
import { ContentPayActions } from "@/components/ContentPayActions";

function youtubeId(raw?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/embed/")[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(raw?: string): string | null {
  if (!raw) return null;
  const m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(raw);
  return m?.[1] ?? null;
}

function EmbedStage({
  provider,
  id,
  url,
  title,
  kind,
  src,
  playing,
}: {
  provider?: string;
  id?: string;
  url?: string;
  title: string;
  kind?: string;
  src?: string;
  playing: boolean;
}) {
  const yt = provider === "youtube" ? id || youtubeId(url) : youtubeId(url);
  const vim = provider === "vimeo" ? id || vimeoId(url) : vimeoId(url);

  if (src && (kind === "audio" || kind === "video")) {
    if (kind === "video") {
      return (
        <video
          className="deck__frame deck__frame--native"
          src={src}
          controls
          playsInline
          autoPlay={playing}
          title={title}
        />
      );
    }
    return (
      <div className="deck__native-audio">
        <audio src={src} controls autoPlay={playing} title={title} />
        <div className="deck__visual deck__visual--mini" aria-hidden>
          <div className="deck__orb" />
          <div className="deck__bars">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if ((provider === "twitch" || (!provider && url?.includes("twitch.tv"))) && (id || url)) {
    const channel = id || url?.split("twitch.tv/")[1]?.split(/[/?#]/)[0];
    if (channel) {
      const srcTw =
        `https://player.twitch.tv/?channel=${channel}` +
        `&parent=www.kamaunegasi.net&parent=kamaunegasi.net&parent=localhost&muted=false`;
      return (
        <iframe
          title={title}
          src={srcTw}
          allowFullScreen
          className="deck__frame"
          allow="autoplay; encrypted-media; fullscreen"
        />
      );
    }
  }

  if (yt) {
    return (
      <iframe
        title={title}
        className="deck__frame"
        src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  if (vim) {
    return (
      <iframe
        title={title}
        className="deck__frame"
        src={`https://player.vimeo.com/video/${vim}?title=0&byline=0&portrait=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (provider === "bandcamp" && id) {
    const srcBc =
      `https://bandcamp.com/EmbeddedPlayer/album=${encodeURIComponent(id)}` +
      `/size=large/bgcol=0a0c0a/linkcol=b8ff3c/artwork=small/transparent=true/`;
    return (
      <iframe
        title={title}
        src={srcBc}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media; clipboard-write"
        loading="lazy"
      />
    );
  }

  if (provider === "soundcloud" && url) {
    const srcSc =
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
      `&color=%23b8ff3c&auto_play=${playing ? "true" : "false"}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    return (
      <iframe
        title={title}
        src={srcSc}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media"
        loading="lazy"
      />
    );
  }

  if (url && /bandcamp\.com/i.test(url)) {
    return (
      <div className="deck__fallback">
        <p>BANDCAMP</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          open in Bandcamp →
        </a>
      </div>
    );
  }

  if (url && /vimeo\.com/i.test(url)) {
    return (
      <div className="deck__fallback">
        <p>VIMEO CHANNEL</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          open archive →
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
        /* keep local */
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
    if (!current) return "NO SIGNAL";
    return `${current.brand} — ${current.title}`;
  }, [current]);

  const isTheater =
    current?.kind === "video" ||
    current?.kind === "live" ||
    current?.kind === "vlog" ||
    current?.embed?.provider === "twitch" ||
    current?.embed?.provider === "youtube" ||
    current?.embed?.provider === "vimeo";

  return (
    <aside
      className={`deck ${expanded ? "deck--open" : ""} ${isTheater ? "deck--theater" : ""}`}
      aria-label="Media player"
    >
      <div className="deck__stage">
        {current ? (
          <EmbedStage
            provider={current.embed?.provider}
            id={current.embed?.id}
            url={current.embed?.url ?? current.externalUrl}
            title={current.title}
            kind={current.kind}
            src={current.src}
            playing={playing}
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
                {kindGlyph(current.kind)} {current.kind} · {current.platform}
              </p>
              <h2>{current.title}</h2>
              {current.subtitle ? <p className="deck__sub">{current.subtitle}</p> : null}
              <RemoteMeta key={current.id} url={current.externalUrl} localTitle={current.title} />
              <p className="deck__blurb">{current.blurb}</p>
              {hasMagazine(current.id) ? (
                <button
                  type="button"
                  className="deck__external deck__mag"
                  onClick={() => openMagazine(current.id)}
                >
                  magazine ▦
                </button>
              ) : null}
              <ContentPayActions catalogId={current.id} title={current.title} />
            </>
          ) : (
            <>
              <p className="deck__eyebrow">DECK IDLE</p>
              <h2>NO SIGNAL</h2>
              <p className="deck__blurb">Pick a title from the stream to play in-app.</p>
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
          {expanded ? "↓" : "↑"}
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
              if (!expanded) setExpanded(true);
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
