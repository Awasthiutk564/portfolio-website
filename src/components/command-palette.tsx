// ⌘K / Ctrl+K (or "/") command palette.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE } from "@/components/motion";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Item = { ic: string; label: string; hint?: string; run: () => void };

// subsequence match, earlier/contiguous hits rank higher
function score(q: string, s: string) {
  s = s.toLowerCase();
  if (s.includes(q)) return 100 - s.indexOf(q);
  let i = 0;
  for (const c of s) if (c === q[i]) i++;
  return i === q.length ? 10 : -1;
}

interface Props {
  p: Profile;
  open: boolean;
  setOpen: (v: boolean) => void;
  copyEmail: () => void;
  openChat: () => void;
}

export function CommandPalette({ p, open, setOpen, copyEmail, openChat }: Props) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const b = p.basics;
    const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    const ext = (url: string) => () => window.open(url, "_blank", "noopener");
    return [
      { ic: "#", label: "About", hint: "section", run: go("about") },
      { ic: "#", label: "Projects", hint: "section", run: go("work") },
      { ic: "#", label: "Experience", hint: "section", run: go("experience") },
      { ic: "#", label: "Stack", hint: "section", run: go("stack") },
      { ic: "#", label: "GitHub activity", hint: "section", run: go("activity") },
      { ic: ">_", label: "Open terminal", hint: "section", run: () => { go("terminal")(); setTimeout(() => document.getElementById("term-input")?.focus({ preventScroll: true }), 600); } },
      { ic: "@", label: "Contact", hint: "section", run: go("contact") },
      { ic: "✉", label: "Copy email address", hint: b.email, run: copyEmail },
      ...(p._meta?.resume_pdf ? [{ ic: "↓", label: "Open résumé", hint: "pdf", run: ext("/resume.pdf") }] : []),
      { ic: "✦", label: "Ask Booglu (AI assistant)", hint: "chat", run: openChat },
      ...(b.profiles || []).map((x) => ({ ic: "↗", label: `Open ${x.network}`, hint: x.username, run: ext(x.url) })),
      ...p.projects.slice(0, 14).map((x) => ({ ic: "◆", label: x.title, hint: "project", run: ext(x.url) })),
    ];
  }, [p, copyEmail, openChat]);

  const query = q.trim().toLowerCase();
  const shown = !query
    ? items
    : items.map((it) => [score(query, it.label + " " + (it.hint || "")), it] as const).filter(([s]) => s >= 0).sort((a, b) => b[0] - a[0]).map(([, it]) => it);

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "/" && !open && !/input|textarea/i.test(document.activeElement?.tagName || "")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function pick(i: number) {
    const it = shown[i];
    if (!it) return;
    setOpen(false);
    it.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <input
              ref={input}
              value={q}
              onChange={(e) => { setQ(e.target.value); setSel(0); }}
              onKeyDown={onKeyDown}
              placeholder="Type a command or search…"
              aria-label="Search commands"
              className="w-full border-b border-border bg-transparent px-5 py-4 text-base outline-none placeholder:text-primary/35"
            />
            <ul ref={list} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {shown.length ? (
                shown.map((it, i) => (
                  <li
                    key={it.label}
                    role="option"
                    aria-selected={i === sel}
                    onClick={() => pick(i)}
                    onMouseMove={() => setSel(i)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      i === sel ? "bg-primary text-black" : "text-primary/80",
                    )}
                  >
                    <span className={cn("w-6 text-center font-mono text-xs", i === sel ? "text-black/60" : "text-primary/40")}>{it.ic}</span>
                    {it.label}
                    <small className={cn("ml-auto truncate pl-4 text-xs", i === sel ? "text-black/55" : "text-primary/40")}>{it.hint}</small>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2.5 text-sm text-primary/50">No matches</li>
              )}
            </ul>
            <p className="border-t border-border px-5 py-2.5 text-xs text-primary/40">↑↓ navigate · ↵ select · esc close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
