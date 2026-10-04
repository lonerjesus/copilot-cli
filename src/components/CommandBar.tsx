"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const COMMANDS = [
  { cmd: "stream", hint: "focus the streaming deck" },
  { cmd: "footprint", hint: "jump to live social signal" },
  { cmd: "play", hint: "toggle media deck" },
  { cmd: "brands", hint: "open alias matrix" },
  { cmd: "help", hint: "list commands" },
] as const;

type CommandBarProps = {
  onCommand: (cmd: string) => void;
};

export function CommandBar({ onCommand }: CommandBarProps) {
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
    const known = COMMANDS.find((c) => c.cmd === raw || raw.startsWith(c.cmd));
    if (known) {
      onCommand(known.cmd);
      setFlash(`ok · ${known.cmd}`);
    } else {
      setFlash(`unknown · try help`);
    }
    setValue("");
    window.setTimeout(() => setFlash(""), 1600);
  };

  return (
    <form className="cmd" onSubmit={submit}>
      <label className="cmd__prompt" htmlFor="terminal-cmd">
        kn@signal:~$
      </label>
      <input
        id="terminal-cmd"
        ref={inputRef}
        className="cmd__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="type stream · footprint · play · brands · help  (press /)"
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
            onClick={() => onCommand(c.cmd)}
            title={c.hint}
          >
            {c.cmd}
          </button>
        ))}
      </div>
    </form>
  );
}
