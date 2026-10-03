import { motion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { Counter, EASE, Reveal, SECTION_X, SectionHead } from "@/components/motion";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

// contribution levels and language shares, both as a ramp of the cream
const LEVEL = ["bg-primary/[0.06]", "bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"];
const SHARE = [1, 0.7, 0.5, 0.36, 0.24, 0.14];

export function Activity({ p }: { p: Profile }) {
  const gh = p.github;
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const inView = useInView(grid, { once: true, amount: 0.3 });

  // show the latest weeks first on narrow screens
  useEffect(() => {
    if (wrap.current) wrap.current.scrollLeft = wrap.current.scrollWidth;
  }, []);

  const days = gh?.contributions || [];
  if (!gh || !days.length) return null;

  const nz = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = (f: number) => nz[Math.min(nz.length - 1, Math.floor(nz.length * f))] || 1;
  const cuts = [q(0.25), q(0.5), q(0.8)];
  const level = (c: number) => (!c ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4);
  const lead = new Date(days[0].date + "T00:00:00").getDay(); // sunday = 0

  const langs = Object.entries(gh.languages || {});
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const top = langs.slice(0, 6);
  const t = gh.totals;

  return (
    <section id="activity" className={`${SECTION_X} py-24 md:py-36`}>
      <SectionHead index="05" label="Activity" title="Commit history doesn't lie" />

      <Reveal>
        <div className="rounded-2xl border border-border bg-card p-6 md:rounded-[2rem] md:p-10">
          <div className="mb-10 grid grid-cols-2 gap-6 md:mb-14">
            <div>
              <p className="font-medium leading-[0.85] tracking-[-0.07em] text-[15vw] md:text-[6vw]">
                <Counter value={t.contributions ?? 0} />
              </p>
              <p className="mt-3 text-sm text-primary/50">contributions in the last year</p>
            </div>
            <div>
              <p className="font-medium leading-[0.85] tracking-[-0.07em] text-[15vw] md:text-[6vw]">
                <Counter value={t.longest_streak ?? 0} />
              </p>
              <p className="mt-3 text-sm text-primary/50">day longest streak</p>
            </div>
          </div>

          <div ref={wrap} className="overflow-x-auto pb-2">
            <div
              ref={grid}
              role="img"
              aria-label={`Contribution calendar: ${t.contributions ?? 0} contributions in the last year`}
              className={cn("heat grid w-max grid-flow-col grid-rows-7 gap-[3px] md:gap-1", inView && "in")}
            >
              {Array.from({ length: lead }, (_, i) => (
                <i key={"pad" + i} className="invisible" />
              ))}
              {days.map((d, i) => {
                const col = Math.floor((i + lead) / 7), row = (i + lead) % 7;
                return (
                  <i
                    key={d.date}
                    title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`}
                    className={cn("block h-[11px] w-[11px] rounded-[3px] md:h-[13px] md:w-[13px]", LEVEL[level(d.count)])}
                    style={{ transitionDelay: `${col * 14 + row * 30}ms` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-primary/45">
            <span className="mr-1">less</span>
            {LEVEL.map((c) => (
              <i key={c} className={cn("block h-[11px] w-[11px] rounded-[3px]", c)} />
            ))}
            <span className="ml-1">more</span>
          </div>

          {!!top.length && (
            <div className="mt-10 border-t border-border pt-8">
              <p className="mb-4 text-sm text-primary/50">Languages across repos</p>
              <div className="flex h-2 gap-1 overflow-hidden rounded-full">
                {top.map(([l, v], i) => (
                  <motion.span
                    key={l}
                    title={l}
                    className="block h-full rounded-full bg-primary"
                    style={{ opacity: SHARE[i] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(v / total) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: EASE }}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary/70">
                {top.map(([l, v], i) => (
                  <span key={l} className="flex items-center gap-2">
                    <i className="block h-2 w-2 rounded-full bg-primary" style={{ opacity: SHARE[i] }} />
                    {l} <span className="text-primary/40">{((v / total) * 100).toFixed(1)}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
