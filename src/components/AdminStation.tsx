"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CATEGORIES, type CategoryId, type SubcategoryId } from "@/data/taxonomy";
import type { MediaKind } from "@/data/catalog";
import type { UploadedContent } from "@/lib/content-store";

const KINDS: MediaKind[] = ["vlog", "essay", "video", "audio", "still", "live"];

const emptyForm = {
  title: "",
  subtitle: "",
  brand: "Telling Show Of Love",
  kind: "vlog" as MediaKind,
  category: "vlog" as CategoryId,
  subcategory: "season" as SubcategoryId,
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
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === form.category),
    [form.category],
  );
  const subs = category?.subcategories ?? [];

  const refresh = async () => {
    const res = await fetch("/api/admin/content", { credentials: "same-origin" });
    if (!res.ok) {
      setError(res.status === 403 ? "admin_only" : "load_failed");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { items: UploadedContent[] };
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

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
          externalUrl: form.externalUrl,
          poster: form.poster || undefined,
          src: form.src || undefined,
          duration: form.duration || undefined,
          blurb: form.blurb,
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
      setForm((f) => ({ ...emptyForm, brand: f.brand, kind: f.kind, category: f.category, subcategory: f.subcategory }));
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
        <p className="section__eyebrow">station://admin</p>
        <h1 id="admin-title">ADMIN STATION</h1>
        <p className="admin__aside">
          Publish vlog, blog, audio, video, stills. House uploads stay paywalled unless you open
          them. Only your account reaches this desk.
        </p>
      </header>

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
                {KINDS.map((k) => (
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
          <div className="admin__row">
            <label>
              <span>platform</span>
              <input
                required
                maxLength={40}
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
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
            <span>media / post url (https)</span>
            <input
              required
              type="url"
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              placeholder="https://"
            />
          </label>
          <label>
            <span>direct media src (optional)</span>
            <input
              type="url"
              value={form.src}
              onChange={(e) => setForm({ ...form, src: e.target.value })}
              placeholder="https://…/file.mp4"
            />
          </label>
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
            <span>blurb</span>
            <textarea
              required
              maxLength={600}
              rows={3}
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            />
          </label>
          <label>
            <span>body (blog / essay / notes)</span>
            <textarea
              rows={8}
              maxLength={50000}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Optional long-form text…"
            />
          </label>
          <label>
            <span>tags (comma)</span>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="TSOL, vlog"
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
            {busy ? "publishing…" : "publish"}
          </button>
        </form>

        <aside className="admin__list" aria-label="Published uploads">
          <h2>uploads · {loading ? "…" : items.length}</h2>
          {items.length === 0 && !loading ? (
            <p className="admin__empty">No uploads yet.</p>
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
