import { Reveal, SECTION_X, SectionHead } from "@/components/motion";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function Stack({ p }: { p: Profile }) {
  const all = [...new Set(p.skills.flatMap((s) => s.items))];
  const ticker = (copy: number) =>
    all.map((s, i) => (
      <span key={`${copy}-${s}`} className="flex shrink-0 items-start">
        <span className={cn("px-[0.25em]", i % 2 && "font-serif font-normal italic tracking-[-0.02em]")}>{s}</span>
        <span className="mt-[0.2em] text-[0.35em] text-primary/40">*</span>
      </span>
    ));

  return (
    <section id="stack" className="py-24 md:py-36">
      <div className={SECTION_X}>
        <SectionHead index="04" label="Stack" title="Tools of the trade" />
      </div>

      <Reveal>
        <div className="overflow-hidden border-y border-border py-6 md:py-8" aria-hidden="true">
          <div className="marquee-track flex w-max whitespace-nowrap font-medium leading-none tracking-[-0.06em] text-[13vw] md:text-[7vw]">
            {ticker(0)}
            {ticker(1)}
          </div>
        </div>
      </Reveal>

      <div className={`${SECTION_X} mt-16 grid gap-3 sm:grid-cols-2 md:mt-24 md:gap-4 lg:grid-cols-3`}>
        {p.skills.map((s, i) => (
          <Reveal key={s.category} delay={(i % 3) * 0.08}>
            <article className="h-full rounded-2xl border border-border bg-card p-6 md:rounded-[2rem] md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-3xl italic">{s.category}</h3>
                <span className="text-xs tabular-nums text-primary/40">{String(s.items.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {s.items.map((it) => (
                  <span key={it} className="rounded-full border border-border px-3 py-1 text-sm text-primary/75 transition-colors hover:bg-primary hover:text-black">
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
