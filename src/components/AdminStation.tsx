"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CATEGORIES, type CategoryId, type SubcategoryId } from "@/data/taxonomy";
import type { MediaKind } from "@/data/catalog";
import type { UploadedContent } from "@/lib/content-store";

type UploadPreset = {
  id: "video" | "photo" | "music";
  label: string;
  kind: MediaKind;
  category: CategoryId;
  subcategory: SubcategoryId;
  blurbHint: string;
  srcHint: string;
};

const PRESETS: UploadPreset[] = [
  {
    id: "video",
    label: "Video",
    kind: "video",
    category: "video",
    subcategory: "archive",
    blurbHint: "House video drop",
    srcHint: "https://…/clip.mp4",
  },
  {
    id: "photo",
    label: "Photo",
    kind: "still",
    category: "visuals",
    subcategory: "stills",
    blurbHint: "House still / photo dump",
    srcHint: "https://…/photo.jpg",
  },
  {
    id: "music",
    label: "Music",
    kind: "audio",
    category: "audio",
    subcategory: "music",
    blurbHint: "House track / mix",
    srcHint: "https://…/track.mp3",
  },
];

const emptyForm = {
  title: "",
  subtitle: "",
  brand: "Telling Show Of Love",
  kind: "video" as MediaKind,
  category: "video" as CategoryId,
  subcategory: "archive" as SubcategoryId,
  platform: "house",
  externalUrl: "",
  poster: "",
  src: "",
  duration: "",
  blurb: "",
  body: "",
  paywalled: true,
  tags: "",
};

export function AdminStation() {
  const [items, setItems] = useState<UploadedContent[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [preset, setPreset] = useState<UploadPreset["id"]>("video");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === form.category),
    [form.category],
  );
  const subs = category?.subcategories ?? [];
  const activePreset = PRESETS.find((p) => p.id === preset) ?? PRESETS[0];

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

  const applyPreset = (next: UploadPreset) => {
    setPreset(next.id);
    setForm((f) => ({
      ...f,
      kind: next.kind,
      category: next.category,
      subcategory: next.subcategory,
      platform: "house",
      paywalled: true,
      blurb: f.blurb || next.blurbHint,
      tags: f.tags || next.id,
    }));
  };

  const onCategory = (id: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      category: id,
      subcategory: (cat?.subcategories[0]?.id ?? f.subcategory) as SubcategoryId,
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setOk("");
    setBusy(true);
    try {
      const mediaUrl = form.src.trim() || form.externalUrl.trim();
      const res = await fetch("/api/admin/content", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || undefined,
          brand: form.brand,
          kind: form.kind,
          category: form.category,
          subcategory: form.subcategory,
          platform: form.platform,
          externalUrl: form.externalUrl.trim() || mediaUrl,
          poster: form.poster || (form.kind === "still" ? form.src || undefined : undefined),
          src: form.src || undefined,
          duration: form.duration || undefined,
          blurb: form.blurb || activePreset.blurbHint,
          body: form.body || undefined,
          paywalled: form.paywalled,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: UploadedContent;
      };
      if (!res.ok) {
        setError(data.error ?? "publish_failed");
        return;
      }
      setOk(`published · ${data.item?.id}`);
      setForm((f) => ({
        ...emptyForm,
        brand: f.brand,
        kind: activePreset.kind,
        category: activePreset.category,
        subcategory: activePreset.subcategory,
      }));
      await refresh();
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
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin" aria-labelledby="admin-title">
      <header className="admin__head">
        <h1 id="admin-title">ADMIN</h1>
        <p className="admin__lead">Upload video, photos, or music to the member stream.</p>
      </header>

      <div className="admin__presets" role="group" aria-label="Upload type">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`admin__preset ${preset === p.id ? "is-active" : ""}`}
            aria-pressed={preset === p.id}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="admin__layout">
        <form className="admin__form" onSubmit={submit}>
          <label>
            <span>title</span>
            <input
              required
              maxLength={160}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            <span>subtitle</span>
            <input
              maxLength={200}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </label>
          <div className="admin__row">
            <label>
              <span>kind</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as MediaKind })}
              >
                {(["video", "still", "audio", "vlog", "essay", "live"] as MediaKind[]).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>brand</span>
              <input
                required
                maxLength={80}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
            <span>media file url (https) — video / photo / audio</span>
            <input
              type="url"
              value={form.src}
              onChange={(e) => setForm({ ...form, src: e.target.value })}
              placeholder={activePreset.srcHint}
              required={!form.externalUrl.trim()}
            />
          </label>
          <label>
            <span>page / post url (optional if media url set)</span>
            <input
              type="url"
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              placeholder="https://www.kamaunegasi.net/"
              required={!form.src.trim()}
            />
          </label>
          <div className="admin__row">
            <label>
              <span>poster url (optional)</span>
              <input
                type="url"
                value={form.poster}
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                placeholder="https://…/art.jpg"
              />
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
          <label>
            <span>blurb</span>
            <textarea
              required
              maxLength={600}
              rows={3}
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
              placeholder={activePreset.blurbHint}
            />
          </label>
          <label>
            <span>body (optional notes)</span>
            <textarea
              rows={6}
              maxLength={50000}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label>
            <span>tags (comma)</span>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder={preset}
            />
          </label>
          <label className="admin__check">
            <input
              type="checkbox"
              checked={form.paywalled}
              onChange={(e) => setForm({ ...form, paywalled: e.target.checked })}
            />
            <span>paywall save / download (house upload)</span>
          </label>

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

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "publishing…" : `publish ${activePreset.label.toLowerCase()}`}
          </button>
        </form>

        <aside className="admin__list" aria-label="Published uploads">
          <h2>uploads · {loading ? "…" : items.length}</h2>
          {items.length === 0 && !loading ? (
            <p className="admin__empty">No uploads yet — use Video / Photo / Music above.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.kind} · {item.platform} · {item.publishedAt}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin__delete"
                    disabled={busy}
                    onClick={() => void remove(item.id)}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
