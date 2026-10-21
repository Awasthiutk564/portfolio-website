import { useReducedMotion, useScroll } from "framer-motion";
import { useMemo, useRef } from "react";
import { Reveal, SECTION_X, SectionHead } from "@/components/motion";
import PerspectiveTunnelHero, { type TunnelItem } from "@/components/ui/perspective-tunnel-hero";
import { WordsPullUp } from "@/components/ui/prisma-hero";
import { pad2, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

/** page scroll, in viewport heights, that it takes to fly the whole tunnel */
const FLIGHT_VH = 300;

/** A tool's card: the site's dark card, sized in container units with the card. */
function ToolCard({ item, i }: { item: TunnelItem; i: number }) {
  return (
    <div className="@container relative h-full w-full overflow-hidden rounded-2xl bg-card shadow-2xl shadow-black/90 ring-1 ring-primary/15 transition-shadow duration-500 hover:ring-ember/60">
      <span aria-hidden="true" className="cover-dots pointer-events-none absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-[9cqw]">
        <div className="flex items-start justify-between gap-[4cqw] font-mono text-[5cqw] uppercase tracking-[0.18em] text-primary/45">
          <span>{pad2(i + 1)}</span>
          <span className="text-right">{item.label}</span>
        </div>
        <p className={cn("leading-[0.95] text-[15cqw]", i % 2 ? "font-serif italic" : "font-medium tracking-[-0.05em]")}>
          {item.title}
        </p>
      </div>
    </div>
  );
}

export function Stack({ p }: { p: Profile }) {
  const still = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });

  // every tool once, categories dealt round-robin so neighbouring cards differ
  const tools = useMemo(() => {
    const seen = new Set<string>();
    const out: TunnelItem[] = [];
    const longest = Math.max(0, ...p.skills.map((s) => s.items.length));
    for (let k = 0; k < longest; k++) {
      for (const s of p.skills) {
        const t = s.items[k];
        if (t && !seen.has(t.toLowerCase())) {
          seen.add(t.toLowerCase());
          out.push({ title: t, label: s.category });
        }
      }
    }
    return out;
  }, [p.skills]);

  if (still) {
    // reduced motion: no flight, the categories as cards
    return (
      <section id="stack" className="py-24 md:py-36">
        <div className={SECTION_X}>
          <SectionHead index="04" label="Stack" title="Tools of the trade" />
        </div>
        <div className={`${SECTION_X} grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3`}>
          {p.skills.map((s, i) => (
            <Reveal key={s.category} delay={(i % 3) * 0.08}>
              <article className="h-full rounded-2xl border border-border bg-card p-6 md:rounded-[2rem] md:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-3xl italic">{s.category}</h3>
                  <span className="text-xs tabular-nums text-primary/40">{String(s.items.length).padStart(2, "0")}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {s.items.map((it) => (
                    <span key={it} className="rounded-full border border-border px-3 py-1 text-sm text-primary/75">
                      {it}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="stack" aria-labelledby="stack-title">
      {/* what the tunnel shows, for screen readers */}
      <h2 id="stack-title" className="sr-only">Tools of the trade</h2>
      <ul className="sr-only">
        {p.skills.map((s) => (
          <li key={s.category}>
            {s.category}: {s.items.join(", ")}
          </li>
        ))}
      </ul>

      {/* the tunnel is pinned while the page scrolls past; the scroll flies it */}
      <div ref={track} className="relative" style={{ height: `calc(100svh + ${FLIGHT_VH}svh)` }}>
        <div className="sticky top-0 h-[100svh]" aria-hidden="true">
          <PerspectiveTunnelHero
            items={tools}
            progress={scrollYProgress}
            renderCard={(item, i) => <ToolCard item={item} i={i} />}
            eyebrow="(04) Stack"
            heading={<WordsPullUp text="Tools of the trade" showAsterisk className="justify-center" />}
            subtitle={`${tools.length} tools I build with, from training models to flashing an ESP32.`}
            prompt="Scroll to fly through"
          />
        </div>
      </div>
    </section>
  );
}
