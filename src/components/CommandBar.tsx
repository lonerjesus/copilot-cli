"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { searchCatalog } from "@/lib/search";
import { findCategoryByQuery } from "@/data/taxonomy";
import { track } from "@/lib/analytics";

const COMMANDS = [
  { cmd: "stream", hint: "A" },
  { cmd: "categories", hint: "B" },
  { cmd: "cosmogram", hint: "C" },
  { cmd: "brands", hint: "D" },
  { cmd: "support", hint: "E" },
  { cmd: "footprint", hint: "F" },
  { cmd: "play", hint: "▶" },
] as const;

type CommandBarProps = {
  onCommand: (cmd: string) => void;
  onSearch: (query: string) => void;
};

export function CommandBar({ onCommand, onSearch }: CommandBarProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const raw = value.trim().toLowerCase().replace(/^\//, "");
    if (!raw) return;

    const known = COMMANDS.find((c) => c.cmd === raw);
    if (known) {
      track("command", { cmd: known.cmd });
      onCommand(known.cmd);
      setFlash(known.hint);
      setValue("");
      window.setTimeout(() => setFlash(""), 1200);
      return;
    }

    const taxonomyHit = findCategoryByQuery(raw);
    if (taxonomyHit.category) {
      track("command", { cmd: "search", q: raw });
      onSearch(raw);
      onCommand("categories");
      setFlash(taxonomyHit.category.id);
      setValue("");
      window.setTimeout(() => setFlash(""), 1200);
      return;
    }

    const hits = searchCatalog(raw);
    if (hits.length > 0) {
      track("command", { cmd: "search", q: raw, hits: hits.length });
      onSearch(raw);
      onCommand("categories");
      setFlash(`${hits.length}`);
      setValue("");
      window.setTimeout(() => setFlash(""), 1200);
      return;
    }

    setFlash("?");
    window.setTimeout(() => setFlash(""), 1200);
  };

  return (
    <form className="cmd" onSubmit={submit}>
      <label className="cmd__prompt" htmlFor="terminal-cmd">
        kn$
      </label>
      <input
        id="terminal-cmd"
        ref={inputRef}
        className="cmd__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="/"
        autoComplete="off"
        spellCheck={false}
      />
      <span className="cmd__flash" aria-live="polite">
        {flash}
      </span>
      <div className="cmd__hints">
        {COMMANDS.map((c) => (
          <button
            key={c.cmd}
            type="button"
            className="cmd__chip"
            onClick={() => {
              track("command", { cmd: c.cmd, via: "chip" });
              onCommand(c.cmd);
            }}
            title={c.cmd}
          >
            {c.hint}
          </button>
        ))}
      </div>
    </form>
  );
}
