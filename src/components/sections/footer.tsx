import { Reveal, SECTION_X } from "@/components/motion";
import { ago, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

function Node({ name, when, note, out }: { name: string; when?: string | boolean | null; note: string; out?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", out ? "border-primary bg-primary text-black" : "border-border")}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <i className={cn("block h-1.5 w-1.5 rounded-full", out ? "bg-black" : when ? "bg-primary" : "bg-primary/25")} />
        {name}
      </p>
      <p className={cn("mt-0.5 text-xs", out ? "text-black/60" : "text-primary/50")}>
        {typeof when === "string" ? "synced " + (ago(when) || when) : note}
      </p>
    </div>
  );
}

export function Footer({ p }: { p: Profile }) {
  const s = p._meta?.sources || {};
  const arrow = <span className="self-center text-primary/30" aria-hidden="true">→</span>;

  return (
    <footer className={`${SECTION_X} pb-8 pt-20 md:pt-28`}>
      <Reveal>
        <p className="mb-5 text-sm text-primary/50">How this page stays current</p>
        <div className="flex flex-wrap items-stretch gap-2">
          <Node name="GitHub API" when={s.github} note="pending" />
          <Node name="LinkedIn export" when={s.linkedin} note="baseline data" />
          <Node name="résumé.pdf → Gemini" when={s.resume} note="baseline data" />
          {arrow}
          <Node name="GitHub Actions" when={null} note="merge → profile.json" />
          {arrow}
          <Node name="this page + Booglu" when={null} note={`built ${ago(p._meta?.built_at)}`} out />
        </div>
      </Reveal>

      <div className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-xs text-primary/50 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {p.basics.name}</span>
        <span className="hidden sm:inline">
          Hero by rahil1202 on 21st.dev · Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">⌘K</kbd>
        </span>
        <a href="https://github.com/Awasthiutk564/portfolio-website" target="_blank" rel="noopener" className="hover:text-primary">
          view source ↗
        </a>
      </div>
    </footer>
  );
}
