"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { CATEGORIES, type CategoryId, type SubcategoryId } from "@/data/taxonomy";
import { SITE } from "@/data/identity";
import type { MediaKind } from "@/data/catalog";
import type { UploadedContent } from "@/lib/content-store";
import { ALLOWED_MEDIA_TYPES, MAX_MEDIA_BYTES, validateUploadFile } from "@/lib/media-store";
import {
  IconAnalytics,
  IconCompose,
  IconData,
  IconLibrary,
  IconMusic,
  IconNote,
  IconPhoto,
  IconVideo,
} from "@/components/NavIcons";
import type { ComponentType } from "react";

type Tab = "compose" | "library" | "analytics" | "data";

type UploadPreset = {
  id: "video" | "photo" | "music" | "essay";
  label: string;
  Icon: ComponentType<{ className?: string }>;
  kind: MediaKind;
  category: CategoryId;
  subcategory: SubcategoryId;
  blurbHint: string;
  accept: string;
};

const PRESETS: UploadPreset[] = [
  {
    id: "video",
    label: "Video",
    Icon: IconVideo,
    kind: "video",
    category: "video",
    subcategory: "archive",
    blurbHint: "House video drop",
    accept: "video/*",
  },
  {
    id: "photo",
    label: "Photo",
    Icon: IconPhoto,
    kind: "still",
    category: "visuals",
    subcategory: "stills",
    blurbHint: "House still",
    accept: "image/*",
  },
  {
    id: "music",
    label: "Music",
    Icon: IconMusic,
    kind: "audio",
    category: "audio",
    subcategory: "music",
    blurbHint: "House track / mix",
    accept: "audio/*",
  },
  {
    id: "essay",
    label: "Note",
    Icon: IconNote,
    kind: "essay",
    category: "writing",
    subcategory: "essays",
    blurbHint: "House note",
    accept: "",
  },
];

const ADMIN_TABS: {
  id: Tab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "compose", label: "Compose", Icon: IconCompose },
  { id: "library", label: "Library", Icon: IconLibrary },
  { id: "analytics", label: "Analytics", Icon: IconAnalytics },
  { id: "data", label: "Data", Icon: IconData },
];

type FormState = {
  title: string;
  subtitle: string;
  kind: MediaKind;
  category: CategoryId;
  subcategory: SubcategoryId;
  platform: string;
  externalUrl: string;
  poster: string;
  src: string;
  duration: string;
  body: string;
  paywalled: boolean;
  tags: string;
};

const emptyForm = (): FormState => ({
  title: "",
  subtitle: "",
  kind: "video",
  category: "video",
  subcategory: "archive",
  platform: "house",
  externalUrl: "",
  poster: "",
  src: "",
  duration: "",
  body: "",
  paywalled: true,
  tags: "",
});

type StatsPayload = {
  memberCount: number;
  onlineCount: number;
  donationCount: number;
  donationCents: number;
  purchaseEvents: number;
  uniquePurchasedPieces: number;
  topPurchased: { catalogId: string; buyers: number }[];
  recentDonations: {
    id: string;
    cents: number;
    at: string;
    mode: string;
    displayName: string;
    email: string;
  }[];
  members: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    purchasedCount: number;
    donatedCentsTotal: number;
    online: boolean;
  }[];
  uploads: {
    total: number;
    byKind: Record<string, number>;
    latest: {
      id: string;
      title: string;
      kind: string;
      publishedAt: string;
      paywalled: boolean;
    }[];
  };
  engagement: {
    totalEvents: number;
    last24h: number;
    bySignal: Record<string, number>;
    topPlayed: { id: string; count: number }[];
    recent: { signal: string; at: number; meta?: Record<string, string | number | boolean> }[];
  };
};

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base.slice(0, 160) || "Untitled";
}

function presetFromFile(file: File): UploadPreset {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return PRESETS.find((p) => p.id === "photo")!;
  if (type.startsWith("audio/")) return PRESETS.find((p) => p.id === "music")!;
  if (type.startsWith("video/")) return PRESETS.find((p) => p.id === "video")!;
  return PRESETS[0]!;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatWhen(isoOrMs: string | number): string {
  const d = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminStation() {
  const [tab, setTab] = useState<Tab>("compose");
  const [items, setItems] = useState<UploadedContent[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [preset, setPreset] = useState<UploadPreset["id"]>("video");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [posterDragOver, setPosterDragOver] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [statsError, setStatsError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const fileInputId = "admin-media-file";
  const posterInputId = "admin-poster-file";

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === form.category),
    [form.category],
  );
  const subs = category?.subcategories ?? [];
  const activePreset = PRESETS.find((p) => p.id === preset) ?? PRESETS[0]!;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/content", { credentials: "same-origin" });
    if (!res.ok) {
      setError(res.status === 403 ? "admin_only" : "load_failed");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { items: UploadedContent[] };
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    setStatsError("");
    try {
      const res = await fetch("/api/admin/stats", { credentials: "same-origin" });
      if (!res.ok) {
        setStatsError(res.status === 403 ? "admin_only" : "stats_failed");
        return;
      }
      setStats((await res.json()) as StatsPayload);
    } catch {
      setStatsError("network_error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/content", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 403 ? "admin_only" : "load_failed");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { items: UploadedContent[] };
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "load_failed");
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const openTab = (next: Tab) => {
    setTab(next);
    if (next === "analytics" || next === "data") void loadStats();
  };

  const applyPreset = (next: UploadPreset) => {
    setPreset(next.id);
    setForm((f) => ({
      ...f,
      kind: next.kind,
      category: next.category,
      subcategory: next.subcategory,
      platform: "house",
      paywalled: next.id === "essay" ? f.paywalled : true,
      tags: f.tags || next.id,
    }));
  };

  const uploadFile = async (file: File, role: "media" | "poster") => {
    validateUploadFile(file, role);
    const body = new FormData();
    body.append("file", file);
    body.append("role", role);
    const res = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
    if (!res.ok) throw new Error(data.error ?? "upload_failed");
    if (!data.url) throw new Error("upload_failed");
    return data.url;
  };

  const ingestFile = async (file: File) => {
    if (busy) return;
    setError("");
    setOk("");
    setBusy(true);
    try {
      const nextPreset = presetFromFile(file);
      applyPreset(nextPreset);
      validateUploadFile(file, "media");
      const url = await uploadFile(file, "media");
      setForm((f) => ({
        ...f,
        kind: nextPreset.kind,
        category: nextPreset.category,
        subcategory: nextPreset.subcategory,
        title: f.title.trim() || titleFromFilename(file.name),
        src: url,
        externalUrl: f.externalUrl.trim() || url,
        poster: nextPreset.kind === "still" ? url : f.poster,
        tags: f.tags || nextPreset.id,
        paywalled: true,
      }));
      setOk("file ready — add a title if needed, then publish");
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload_failed");
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void ingestFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void ingestFile(file);
  };

  const ingestPoster = async (file: File) => {
    if (busy) return;
    setError("");
    setOk("");
    setBusy(true);
    try {
      validateUploadFile(file, "poster");
      const url = await uploadFile(file, "poster");
      setForm((f) => ({ ...f, poster: url }));
      setOk("thumbnail ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload_failed");
    } finally {
      setBusy(false);
    }
  };

  const onPickPoster = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void ingestPoster(file);
  };

  const onDropPoster = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setPosterDragOver(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void ingestPoster(file);
  };

  const clearPoster = () => {
    setForm((f) => ({ ...f, poster: "" }));
    setOk("");
  };

  const onCategory = (id: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      category: id,
      subcategory: (cat?.subcategories[0]?.id ?? f.subcategory) as SubcategoryId,
    }));
  };

  const resetCompose = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      kind: activePreset.kind,
      category: activePreset.category,
      subcategory: activePreset.subcategory,
      tags: activePreset.id,
    });
    setOk("");
    setError("");
  };

  const startEdit = (item: UploadedContent) => {
    setTab("compose");
    setEditingId(item.id);
    setAdvanced(true);
    const match =
      PRESETS.find((p) => p.kind === item.kind) ??
      PRESETS.find((p) => p.id === "video")!;
    setPreset(match.id);
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? "",
      kind: item.kind,
      category: item.category,
      subcategory: item.subcategory,
      platform: item.platform,
      externalUrl: item.externalUrl,
      poster: item.poster ?? "",
      src: item.src ?? "",
      duration: item.duration ?? "",
      body: item.body ?? "",
      paywalled: item.paywalled !== false,
      tags: (item.tags ?? []).join(", "),
    });
    setOk(`editing · ${item.id}`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setOk("");
    setBusy(true);
    try {
      const mediaUrl = form.src.trim() || form.externalUrl.trim();
      if (!mediaUrl && form.kind !== "essay") {
        setError("drop a file or paste a media url");
        return;
      }
      const externalUrl =
        form.externalUrl.trim() ||
        mediaUrl ||
        SITE.url + "/";
      const title = form.title.trim() || "Untitled";
      const subtitle = form.subtitle.trim();

      const payload = {
        title,
        subtitle: subtitle || undefined,
        brand: SITE.title,
        kind: form.kind,
        category: form.category,
        subcategory: form.subcategory,
        platform: form.platform,
        externalUrl,
        poster: form.poster || (form.kind === "still" ? form.src || undefined : undefined),
        src: form.src || undefined,
        duration: form.duration || undefined,
        blurb: subtitle || title || activePreset.blurbHint,
        body: form.body || undefined,
        paywalled: form.paywalled,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/admin/content", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: UploadedContent;
      };
      if (!res.ok) {
        setError(data.error ?? "publish_failed");
        return;
      }
      setOk(editingId ? `saved · ${data.item?.id}` : `published · ${data.item?.id}`);
      resetCompose();
      await refresh();
      if (!editingId) setTab("library");
    } catch {
      setError("network_error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(`Remove ${id}?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        setError("delete_failed");
        return;
      }
      if (editingId === id) resetCompose();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const downloadData = () => {
    if (!stats) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            uploads: items,
            members: stats.members,
            donations: stats.recentDonations,
            engagement: stats.engagement,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kamaunegasi-admin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin__head">
        <h1 id="admin-title">ADMIN</h1>
        <p className="admin__lead">Upload · title · subtitle · tags.</p>
      </header>

      <nav className="admin__tabs" aria-label="Admin tools">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin__tab ${tab === t.id ? "is-active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            aria-label={t.label}
            title={t.label}
            onClick={() => openTab(t.id)}
          >
            <t.Icon className="admin__tab-icon" />
            {t.id === "library" && !loading ? (
              <span className="admin__tab-count">{items.length}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "compose" ? (
        <div className="admin__compose">
          <div className="admin__presets" role="group" aria-label="Post type">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`admin__preset ${preset === p.id ? "is-active" : ""}`}
                aria-pressed={preset === p.id}
                aria-label={p.label}
                title={p.label}
                onClick={() => applyPreset(p)}
              >
                <p.Icon className="admin__preset-icon" />
              </button>
            ))}
          </div>

          {preset !== "essay" ? (
            <label
              htmlFor={fileInputId}
              className={`admin__drop ${dragOver ? "is-over" : ""} ${form.src ? "has-file" : ""} ${busy ? "is-busy" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              aria-busy={busy}
            >
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                className="admin__file-hidden"
                accept={
                  activePreset.accept ||
                  [...ALLOWED_MEDIA_TYPES.media].join(",")
                }
                disabled={busy}
                onChange={onPickFile}
              />
              {form.src ? (
                <>
                  <p className="admin__drop-title">Ready</p>
                  <p className="admin__drop-sub">{form.src.replace(/^https?:\/\/[^/]+/, "")}</p>
                  <p className="admin__drop-hint">Drop another file to replace · up to {Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB</p>
                </>
              ) : (
                <>
                  <p className="admin__drop-title">
                    {busy ? "Uploading…" : "Drop video, photo, or audio"}
                  </p>
                  <p className="admin__drop-hint">
                    or click to choose · up to {Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB · Cloudflare
                  </p>
                </>
              )}
            </label>
          ) : null}

          <form className="admin__form admin__form--compose" onSubmit={submit}>
            <label>
              <span>title</span>
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                autoFocus
              />
            </label>
            <label>
              <span>subtitle</span>
              <input
                maxLength={200}
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Add a subtitle…"
              />
            </label>
            <label>
              <span>tags</span>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="tags, comma, separated"
              />
            </label>
            {preset === "essay" ? (
              <label>
                <span>body</span>
                <textarea
                  rows={10}
                  maxLength={50000}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Start writing…"
                />
              </label>
            ) : null}

            <div className="admin__thumb">
              <span className="admin__thumb-label">thumbnail</span>
              <label
                htmlFor={posterInputId}
                className={`admin__drop admin__drop--thumb ${posterDragOver ? "is-over" : ""} ${form.poster ? "has-file" : ""} ${busy ? "is-busy" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setPosterDragOver(true);
                }}
                onDragLeave={() => setPosterDragOver(false)}
                onDrop={onDropPoster}
                aria-busy={busy}
              >
                <input
                  id={posterInputId}
                  ref={posterRef}
                  type="file"
                  className="admin__file-hidden"
                  accept={[...ALLOWED_MEDIA_TYPES.poster].join(",")}
                  disabled={busy}
                  onChange={onPickPoster}
                />
                {form.poster ? (
                  <>
                    <img className="admin__thumb-preview" src={form.poster} alt="" />
                    <p className="admin__drop-title">Thumbnail ready</p>
                    <p className="admin__drop-sub">
                      {form.poster.replace(/^https?:\/\/[^/]+/, "")}
                    </p>
                    <p className="admin__drop-hint">Drop another image to replace</p>
                  </>
                ) : (
                  <>
                    <p className="admin__drop-title">
                      {busy ? "Uploading…" : "Drop thumbnail image"}
                    </p>
                    <p className="admin__drop-hint">
                      or click · jpeg / png / webp / gif
                    </p>
                  </>
                )}
              </label>
              {form.poster ? (
                <button
                  type="button"
                  className="btn btn--ghost admin__thumb-clear"
                  onClick={clearPoster}
                  disabled={busy}
                >
                  clear thumbnail
                </button>
              ) : null}
            </div>

            <label className="admin__check">
              <input
                type="checkbox"
                checked={form.paywalled}
                onChange={(e) => setForm({ ...form, paywalled: e.target.checked })}
              />
              <span>paywall save / download</span>
            </label>

            <button
              type="button"
              className="admin__advanced-toggle"
              aria-expanded={advanced}
              onClick={() => setAdvanced((v) => !v)}
            >
              {advanced ? "Hide details" : "More details"}
            </button>

            {advanced ? (
              <div className="admin__advanced">
                <div className="admin__row">
                  <label>
                    <span>kind</span>
                    <select
                      value={form.kind}
                      onChange={(e) => setForm({ ...form, kind: e.target.value as MediaKind })}
                    >
                      {(["video", "still", "audio", "vlog", "essay", "live"] as MediaKind[]).map(
                        (k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    <span>duration</span>
                    <input
                      maxLength={24}
                      placeholder="3:21"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                  </label>
                </div>
                <div className="admin__row">
                  <label>
                    <span>category</span>
                    <select
                      value={form.category}
                      onChange={(e) => onCategory(e.target.value as CategoryId)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>subcategory</span>
                    <select
                      value={form.subcategory}
                      onChange={(e) =>
                        setForm({ ...form, subcategory: e.target.value as SubcategoryId })
                      }
                    >
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>media url</span>
                  <input
                    type="url"
                    value={form.src}
                    onChange={(e) => setForm({ ...form, src: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
                <label>
                  <span>page url</span>
                  <input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  />
                </label>
                <label>
                  <span>poster url (optional)</span>
                  <input
                    type="url"
                    value={form.poster}
                    onChange={(e) => setForm({ ...form, poster: e.target.value })}
                    placeholder="https://… or /api/media/house/…"
                  />
                </label>
                {preset !== "essay" ? (
                  <label>
                    <span>body notes</span>
                    <textarea
                      rows={4}
                      maxLength={50000}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="admin__msg admin__msg--err" role="alert">
                {error}
              </p>
            ) : null}
            {ok ? (
              <p className="admin__msg" role="status">
                {ok}
              </p>
            ) : null}

            <div className="admin__compose-actions">
              {editingId ? (
                <button type="button" className="btn btn--ghost" onClick={resetCompose} disabled={busy}>
                  cancel edit
                </button>
              ) : null}
              <button type="submit" className="btn btn--primary" disabled={busy}>
                {busy ? "working…" : editingId ? "save changes" : "publish"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {tab === "library" ? (
        <div className="admin__library">
          <header className="admin__panel-head">
            <h2>Library · {loading ? "…" : items.length}</h2>
            <button type="button" className="btn btn--ghost" onClick={() => setTab("compose")}>
              new post
            </button>
          </header>
          {items.length === 0 && !loading ? (
            <p className="admin__empty">Nothing published yet — drop a file on Compose.</p>
          ) : (
            <ul className="admin__library-list">
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.kind} · {item.paywalled !== false ? "paywalled" : "open"} ·{" "}
                      {item.publishedAt}
                    </span>
                  </div>
                  <div className="admin__library-actions">
                    <button
                      type="button"
                      className="admin__edit"
                      disabled={busy}
                      onClick={() => startEdit(item)}
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      className="admin__delete"
                      disabled={busy}
                      onClick={() => void remove(item.id)}
                    >
                      remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="admin__analytics">
          {statsError ? (
            <p className="admin__msg admin__msg--err" role="alert">
              {statsError}
            </p>
          ) : !stats ? (
            <p className="admin__empty">Loading analytics…</p>
          ) : (
            <>
              <div className="admin__stat-grid">
                <div className="admin__stat">
                  <strong>{stats.memberCount}</strong>
                  <span>members</span>
                </div>
                <div className="admin__stat">
                  <strong>{stats.onlineCount}</strong>
                  <span>online now</span>
                </div>
                <div className="admin__stat">
                  <strong>{formatUsd(stats.donationCents)}</strong>
                  <span>donations</span>
                </div>
                <div className="admin__stat">
                  <strong>{stats.purchaseEvents}</strong>
                  <span>purchases</span>
                </div>
                <div className="admin__stat">
                  <strong>{stats.uploads.total}</strong>
                  <span>house uploads</span>
                </div>
                <div className="admin__stat">
                  <strong>{stats.engagement.last24h}</strong>
                  <span>signals · 24h</span>
                </div>
              </div>

              <div className="admin__analytics-cols">
                <section>
                  <h3>Engagement</h3>
                  <ul className="admin__kv">
                    {Object.entries(stats.engagement.bySignal)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 12)
                      .map(([signal, count]) => (
                        <li key={signal}>
                          <span>{signal}</span>
                          <strong>{count}</strong>
                        </li>
                      ))}
                    {Object.keys(stats.engagement.bySignal).length === 0 ? (
                      <li className="admin__empty">No member signals yet — play / browse to seed.</li>
                    ) : null}
                  </ul>
                </section>
                <section>
                  <h3>Top played</h3>
                  <ul className="admin__kv">
                    {stats.engagement.topPlayed.map((row) => (
                      <li key={row.id}>
                        <span>{row.id}</span>
                        <strong>{row.count}</strong>
                      </li>
                    ))}
                    {stats.engagement.topPlayed.length === 0 ? (
                      <li className="admin__empty">No plays recorded yet.</li>
                    ) : null}
                  </ul>
                </section>
                <section>
                  <h3>Top purchased</h3>
                  <ul className="admin__kv">
                    {stats.topPurchased.map((row) => (
                      <li key={row.catalogId}>
                        <span>{row.catalogId}</span>
                        <strong>{row.buyers}</strong>
                      </li>
                    ))}
                    {stats.topPurchased.length === 0 ? (
                      <li className="admin__empty">No purchases yet.</li>
                    ) : null}
                  </ul>
                </section>
              </div>

              <section className="admin__recent">
                <h3>Recent signals</h3>
                <ul>
                  {stats.engagement.recent.slice(0, 16).map((e, i) => (
                    <li key={`${e.at}-${i}`}>
                      <strong>{e.signal}</strong>
                      <span>{formatWhen(e.at)}</span>
                      {e.meta?.id ? <span>{String(e.meta.id)}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="admin__data">
          <header className="admin__panel-head">
            <h2>Data</h2>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!stats}
              onClick={downloadData}
            >
              export JSON
            </button>
          </header>
          {statsError ? (
            <p className="admin__msg admin__msg--err">{statsError}</p>
          ) : !stats ? (
            <p className="admin__empty">Loading…</p>
          ) : (
            <>
              <p className="admin__aside">
                Members, donations, and house uploads — no password hashes. Use export for backup /
                spreadsheets.
              </p>
              <div className="admin__data-grid">
                <section>
                  <h3>Members · {stats.members.length}</h3>
                  <ul className="admin__data-table">
                    {stats.members.slice(0, 40).map((m) => (
                      <li key={m.id}>
                        <strong>
                          {m.displayName}
                          {m.online ? " · online" : ""}
                        </strong>
                        <span>
                          {m.email} · buys {m.purchasedCount} · {formatUsd(m.donatedCentsTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Recent donations</h3>
                  <ul className="admin__data-table">
                    {stats.recentDonations.map((d) => (
                      <li key={d.id}>
                        <strong>
                          {formatUsd(d.cents)} · {d.displayName}
                        </strong>
                        <span>
                          {d.email} · {formatWhen(d.at)} · {d.mode}
                        </span>
                      </li>
                    ))}
                    {stats.recentDonations.length === 0 ? (
                      <li className="admin__empty">No donations yet.</li>
                    ) : null}
                  </ul>
                </section>
                <section>
                  <h3>Uploads by kind</h3>
                  <ul className="admin__kv">
                    {Object.entries(stats.uploads.byKind).map(([kind, count]) => (
                      <li key={kind}>
                        <span>{kind}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                    {stats.uploads.total === 0 ? (
                      <li className="admin__empty">No uploads.</li>
                    ) : null}
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
