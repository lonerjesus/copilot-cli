"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { kindGlyph } from "@/lib/format";
import { track } from "@/lib/analytics";
import { ContentPayActions } from "@/components/ContentPayActions";

function youtubeId(raw?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split(/[/?#]/)[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      return (
        u.searchParams.get("v") ||
        u.pathname.split("/embed/")[1]?.split(/[/?#]/)[0] ||
        u.pathname.split("/shorts/")[1]?.split(/[/?#]/)[0] ||
        null
      );
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

function twitchChannel(raw?: string, id?: string): string | null {
  if (id) return id;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!u.hostname.includes("twitch.tv")) return null;
    const part = u.pathname.replace(/^\//, "").split(/[/?#]/)[0];
    if (!part || part === "videos" || part === "directory") return null;
    return part;
  } catch {
    return null;
  }
}

function bandcampAlbumFromPoster(poster?: string): string | null {
  if (!poster) return null;
  const m = /\/a(\d+)_/i.exec(poster);
  return m?.[1] ?? null;
}

function albumIdFromOEmbedHtml(html?: string): string | null {
  if (!html) return null;
  const album = /album[=/](\d+)/i.exec(html);
  if (album?.[1]) return album[1];
  const track = /track[=/](\d+)/i.exec(html);
  return track?.[1] ?? null;
}

function NativeMedia({
  kind,
  src,
  title,
  playing,
  onEnded,
}: {
  kind: "audio" | "video";
  src: string;
  title: string;
  playing: boolean;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const node = kind === "video" ? videoRef.current : audioRef.current;
    if (!node) return;
    if (playing) {
      const p = node.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    } else {
      node.pause();
    }
  }, [playing, kind, src]);

  if (kind === "video") {
    return (
      <video
        ref={videoRef}
        className="deck__frame deck__frame--native"
        src={src}
        controls
        playsInline
        title={title}
        onEnded={() => onEnded?.()}
      />
    );
  }

  return (
    <div className="deck__native-audio">
      <audio ref={audioRef} src={src} controls title={title} onEnded={() => onEnded?.()} />
      <div className={`deck__visual deck__visual--mini ${playing ? "is-playing" : ""}`} aria-hidden>
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

function EmbedStage({
  provider,
  id,
  url,
  title,
  kind,
  src,
  poster,
  playing,
  onEnded,
}: {
  provider?: string;
  id?: string;
  url?: string;
  title: string;
  kind?: string;
  src?: string;
  poster?: string;
  playing: boolean;
  onEnded?: () => void;
}) {
  const [resolvedBandcampId, setResolvedBandcampId] = useState<string | null>(null);
  const isBandcamp = provider === "bandcamp" || Boolean(url && /bandcamp\.com/i.test(url));
  const isSoundcloud =
    provider === "soundcloud" || Boolean(url && /soundcloud\.com/i.test(url));
  const bandcampId =
    (provider === "bandcamp" ? id : undefined) ||
    resolvedBandcampId ||
    bandcampAlbumFromPoster(poster);

  useEffect(() => {
    if (!isBandcamp || bandcampId || !url) return;
    let alive = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { html?: string; thumbnail_url?: string };
        const fromHtml = albumIdFromOEmbedHtml(data.html);
        const fromThumb = bandcampAlbumFromPoster(data.thumbnail_url);
        const next = fromHtml || fromThumb;
        if (alive && next) setResolvedBandcampId(next);
      } catch {
        /* keep fallback */
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [isBandcamp, bandcampId, url]);

  if (src && (kind === "audio" || kind === "video")) {
    return <NativeMedia kind={kind} src={src} title={title} playing={playing} onEnded={onEnded} />;
  }

  // Player is AV-only — essays/stills never render a stage.
  if (kind === "essay" || kind === "still") {
    return (
      <div className="deck__visual deck__visual--blocked" aria-hidden>
        <div className="deck__orb" />
        <p className="deck__blocked">audio / video only</p>
      </div>
    );
  }

  const channel = twitchChannel(url, provider === "twitch" ? id : undefined);
  if (channel && (provider === "twitch" || url?.includes("twitch.tv"))) {
    const parents = ["www.kamaunegasi.net", "kamaunegasi.net", "localhost"];
    const srcTw =
      `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}` +
      parents.map((p) => `&parent=${p}`).join("") +
      `&autoplay=${playing ? "true" : "false"}&muted=false`;
    return (
      <iframe
        key={`twitch-${channel}-${playing ? "on" : "off"}`}
        title={title}
        src={srcTw}
        allowFullScreen
        className="deck__frame"
        allow="autoplay; encrypted-media; fullscreen"
      />
    );
  }

  const yt = provider === "youtube" ? id || youtubeId(url) : youtubeId(url);
  if (yt) {
    const srcYt =
      `https://www.youtube.com/embed/${yt}` +
      `?rel=0&modestbranding=1&playsinline=1&enablejsapi=1` +
      `&autoplay=${playing ? 1 : 0}`;
    return (
      <iframe
        key={`yt-${yt}-${playing ? "on" : "off"}`}
        title={title}
        className="deck__frame"
        src={srcYt}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  const vim = provider === "vimeo" ? id || vimeoId(url) : vimeoId(url);
  if (vim) {
    const srcVim =
      `https://player.vimeo.com/video/${vim}?title=0&byline=0&portrait=0` +
      `&autoplay=${playing ? 1 : 0}`;
    return (
      <iframe
        key={`vim-${vim}-${playing ? "on" : "off"}`}
        title={title}
        className="deck__frame"
        src={srcVim}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isBandcamp && bandcampId) {
    const srcBc =
      `https://bandcamp.com/EmbeddedPlayer/album=${encodeURIComponent(bandcampId)}` +
      `/size=large/bgcol=0a0c0a/linkcol=b8ff3c/artwork=small/transparent=true/` +
      (playing ? "tracklist=false/" : "");
    return (
      <iframe
        key={`bc-${bandcampId}`}
        title={title}
        src={srcBc}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media; clipboard-write"
      />
    );
  }

  if (isSoundcloud && url) {
    const scUrl = url.replace("m.soundcloud.com", "soundcloud.com");
    const srcSc =
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}` +
      `&color=%23b8ff3c&auto_play=${playing ? "true" : "false"}` +
      `&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    return (
      <iframe
        key={`sc-${scUrl}-${playing ? "on" : "off"}`}
        title={title}
        src={srcSc}
        className="deck__frame deck__frame--audio"
        allow="autoplay; encrypted-media"
      />
    );
  }

  if (isBandcamp && url) {
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
        <p>VIMEO</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          open on Vimeo →
        </a>
      </div>
    );
  }

  return (
    <div className={`deck__visual ${playing ? "is-playing" : ""}`} aria-hidden>
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
    upNext,
    toggle,
    next,
    prev,
    playItem,
    setExpanded,
    setProgress,
  } = usePlayer();
  const { openMagazine, hasMagazine } = useMagazine();

  const label = useMemo(() => {
    if (!current) return "NO SIGNAL";
    return current.title;
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
            key={current.id}
            provider={current.embed?.provider}
            id={current.embed?.id}
            url={current.embed?.url ?? current.externalUrl}
            title={current.title}
            kind={current.kind}
            src={current.src}
            poster={current.poster}
            playing={playing}
            onEnded={() => {
              track("next", { id: current.id, via: "ended" });
              next();
            }}
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
              {upNext.length ? (
                <div className="deck__upnext" aria-label="Up next">
                  <p className="deck__upnext-label">UP NEXT · {upNext.length}</p>
                  <ul className="deck__upnext-list">
                    {upNext.slice(0, 6).map((item, i) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="deck__upnext-item"
                          onClick={() => playItem(item)}
                        >
                          <span className="deck__upnext-idx">{i + 1}</span>
                          <span className="deck__upnext-title">{item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="deck__eyebrow">DECK</p>
              <h2>—</h2>
              <p className="deck__blurb">idle</p>
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
          {upNext[0] ? (
            <span className="deck__upnext-peek" title={upNext[0].title}>
              next · {upNext[0].title}
            </span>
          ) : null}
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
