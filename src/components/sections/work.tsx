import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE, Reveal, SECTION_X, SectionHead } from "@/components/motion";
import { LiquidButton } from "@/components/ui/liquid-button";
import { WorksWheel } from "@/components/ui/works-wheel";
import { ago, pad2, type Profile, type Project } from "@/lib/profile";
import { scrollToY } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

const VISIBLE = 8;
/** projects on the wheel (featured first); the rest are a click away on GitHub */
const WHEEL = 8;
/** page scroll per wheel step, in viewport heights */
const STEP_VH = 45;
const keysOf = (x: Project) => [...new Set([x.language, ...(x.tags || [])].filter(Boolean) as string[])];

/** A project's card face on the wheel: the site's dark card, with a halftone
    corner like the footer, sized in container units so it scales with the card. */
function Cover({ x, i }: { x: Project; i: number }) {
  return (
    <span className="@container block size-full bg-card text-left text-primary">
      <span className="relative flex size-full flex-col justify-between p-[6cqw]">
        <span aria-hidden="true" className="cover-dots pointer-events-none absolute inset-0" />
        <span className="relative flex items-start justify-between font-mono text-[2.5cqw] uppercase tracking-[0.18em] text-primary/45">
          <span>{pad2(i + 1)}</span>
          <span>{x.language || "—"}</span>
        </span>
        <span className="relative block">
          <span className="block font-serif text-[7.4cqw] italic leading-[1]">{x.tagline || x.title}</span>
          {x.description && (
            <span className="mt-[2.4cqw] line-clamp-2 text-[2.9cqw] leading-snug text-primary/55">{x.description}</span>
          )}
        </span>
        <span className="relative flex flex-wrap gap-x-[3cqw] font-mono text-[2.3cqw] text-primary/45">
          <span>★ {x.stars || 0}</span>
          <span>⑂ {x.forks || 0}</span>
          {x.pushed_at && <span>updated {ago(x.pushed_at)}</span>}
          {x.homepage && <span className="text-primary/80">live ↗</span>}
        </span>
      </span>
    </span>
  );
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Scroll position (in steps) → wheel turn. The ring holds for a moment, then
    opens; after that each project rests at the front for half a step before the
    next one turns in, so every card gets a clear look. */
function turnAt(x: number, n: number) {
  if (x <= 1) return smooth(clamp01((x - 0.2) / 0.8));
  const v = x - 1;
  const i = Math.floor(v);
  return Math.min(n, 1 + i + smooth(clamp01((v - i - 0.45) / 0.55)));
}

/** The wheel pinned in a tall track: scrolling the page turns it, so it moves
    with smooth scroll and never captures the mouse wheel. */
function WheelStage({ items }: { items: Project[] }) {
  const track = useRef<HTMLDivElement>(null);
  const goal = useRef(0);
  const n = items.length;
  const steps = n + 0.6; // the ring opening, one per project, and a rest after the last
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => (goal.current = turnAt(p * steps, n)));
  useEffect(() => {
    goal.current = turnAt(scrollYProgress.get() * steps, n);
  }, [scrollYProgress, steps, n]);

  // bring project i to the front: scroll to the start of its resting spot
  const pick = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY;
    scrollToY(top + ((1 + i + 0.2) / steps) * (el.offsetHeight - innerHeight));
  };

  return (
    <div ref={track} className="relative hidden md:block" style={{ height: `calc(100svh + ${steps * STEP_VH}svh)` }}>
      <div className="sticky top-0 h-[100svh]">
        <WorksWheel
          items={items.map((x, i) => ({ title: x.title, href: x.url, cover: <Cover x={x} i={i} /> }))}
          label={`Works '${String(new Date().getFullYear()).slice(-2)}`}
          action="Open repo"
          goal={goal}
          onPick={pick}
          className="font-medium tracking-[-0.04em]"
        />
      </div>
    </div>
  );
}

function ProjectRow({ x, i }: { x: Project; i: number }) {
  return (
    <motion.li
      layout
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.8, ease: EASE, layout: { duration: 0.6, ease: EASE } }}
      className="group relative border-t border-border transition-colors duration-500 hover:bg-primary/[0.03] has-[h3_a:focus-visible]:bg-primary/[0.05]"
    >
      {/* hairline that draws across on hover */}
      <span className="pointer-events-none absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-primary transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
      <div className="grid grid-cols-12 gap-x-4 gap-y-4 py-7 md:py-10">
        <span className="col-span-2 pt-1 text-sm tabular-nums text-primary/40 md:col-span-1 md:pt-2">{pad2(i + 1)}</span>

        <div className="col-span-10 md:col-span-5">
          <h3 className="font-medium leading-[0.9] tracking-[-0.055em] text-[10vw] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 sm:text-5xl md:text-[3.6vw]">
            {/* stretched link: the whole row opens the repo */}
            <a href={x.url} target="_blank" rel="noopener" className="outline-none after:absolute after:inset-0">
              {x.title}
            </a>
          </h3>
          {x.tagline && <p className="mt-3 font-serif text-xl italic text-primary/80 md:text-2xl">{x.tagline}</p>}
        </div>

        <div className="col-span-12 md:col-span-5">
          {x.description && <p className="line-clamp-3 text-sm text-primary/60 md:text-base" style={{ lineHeight: 1.35 }}>{x.description}</p>}
          {!!x.tags?.length && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...new Set(x.tags)].slice(0, 4).map((t) => (
                <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-primary/70">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary/45">
            {x.language && <span>{x.language}</span>}
            {x.repo && (
              <>
                <span title="stars">★ {x.stars || 0}</span>
                <span title="forks">⑂ {x.forks || 0}</span>
              </>
            )}
            {x.pushed_at && <span>updated {ago(x.pushed_at)}</span>}
            {x.homepage && (
              <a href={x.homepage} target="_blank" rel="noopener" className="relative z-10 text-primary underline underline-offset-4">
                live ↗
              </a>
            )}
          </div>
        </div>

        <div className="col-span-1 hidden justify-end md:flex">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-45 group-hover:border-primary group-hover:bg-primary group-hover:text-black">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.li>
  );
}

export function Work({ p }: { p: Profile }) {
  const list = p.projects;
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(false);

  // the most common tags/languages across projects
  const keys = useMemo(() => {
    const counts: Record<string, number> = {};
    list.forEach((x) => keysOf(x).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k]) => k);
  }, [list]);

  const filtered = filter === "All" ? list : list.filter((x) => keysOf(x).includes(filter));
  const shown = filter === "All" && !expanded ? filtered.slice(0, VISIBLE) : filtered;

  const github = p.basics.profiles.find((x) => x.network === "GitHub")?.url;

  return (
    <section id="work" className="py-24 md:py-36">
      <div className={SECTION_X}>
        <SectionHead
          index="02"
          label="Selected work"
          title="Things I've shipped"
          sub={
            <>
              Pulled live from the GitHub API. New repos show up here automatically.
              <span className="hidden md:inline"> Keep scrolling to turn the wheel.</span>
            </>
          }
        />
      </div>

      {/* desktop: the works wheel */}
      <WheelStage items={list.slice(0, WHEEL)} />
      {github && list.length > WHEEL && (
        <Reveal className={`${SECTION_X} mt-12 hidden md:block`}>
          <LiquidButton href={`${github}?tab=repositories`} target="_blank" rel="noopener" icon={<ArrowUpRight className="h-4 w-4" />}>
            All {list.length} projects on GitHub
          </LiquidButton>
        </Reveal>
      )}

      {/* phones: the list, where the wheel's cards would be too small to read */}
      <div className={`${SECTION_X} md:hidden`}>
      <Reveal>
        <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects">
          {["All", ...keys].map((k) => {
            const on = k === filter;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(k)}
                className="relative rounded-full border border-border px-4 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {on && <motion.span layoutId="work-filter" className="absolute inset-0 rounded-full bg-primary" transition={{ duration: 0.5, ease: EASE }} />}
                <span className={cn("relative transition-colors duration-300", on ? "text-black" : "text-primary/70 hover:text-primary")}>{k}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <ul className="border-b border-border">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((x, i) => (
            <ProjectRow key={x.url} x={x} i={i} />
          ))}
        </AnimatePresence>
      </ul>

      {filter === "All" && !expanded && list.length > VISIBLE && (
        <Reveal className="mt-10">
          <LiquidButton onClick={() => setExpanded(true)} icon={<Plus className="h-4 w-4" />}>
            Show all {list.length} projects
          </LiquidButton>
        </Reveal>
      )}
      </div>
    </section>
  );
}
