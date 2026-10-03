import { Reveal, SECTION_X, SectionHead } from "@/components/motion";
import { initials, ym, type Profile } from "@/lib/profile";

const row = "grid grid-cols-12 gap-x-4 gap-y-3 border-t border-border py-7 md:py-10";

export function Experience({ p }: { p: Profile }) {
  return (
    <section id="experience" className={`${SECTION_X} py-24 md:py-36`}>
      <SectionHead index="03" label="Experience" title="Where I've been" sub="Synced from LinkedIn & my résumé." />

      <ol className="border-b border-border">
        {p.experience.map((e, i) => (
          <li key={e.company + e.title}>
            <Reveal className={row} delay={i * 0.06}>
              <p className="col-span-12 flex items-center gap-2 text-sm text-primary/50 md:col-span-3 md:pt-2">
                {!e.end && (
                  <span className="relative flex h-2 w-2">
                    <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-primary" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
                {ym(e.start) || "?"} — {e.end ? ym(e.end) : <span className="text-primary">Present</span>}
              </p>
              <div className="col-span-12 md:col-span-9">
                <h3 className="font-medium leading-[0.95] tracking-[-0.05em] text-[8.5vw] sm:text-5xl md:text-[3.4vw]">
                  {e.title} <span className="font-serif font-normal italic tracking-[-0.02em] text-primary/60">at {e.company}</span>
                </h3>
                {e.location && <p className="mt-3 text-sm text-primary/45">{e.location}</p>}
                {e.summary && (
                  <p className="mt-4 max-w-2xl text-sm text-primary/65 md:text-base" style={{ lineHeight: 1.35 }}>
                    {e.summary}
                  </p>
                )}
                {!!e.highlights?.length && (
                  <ul className="mt-4 max-w-2xl space-y-1.5 text-sm text-primary/65">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span className="text-primary/35">*</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                {!!e.tags?.length && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {e.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-primary/70">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-24 grid gap-16 md:mt-32 md:grid-cols-2 md:gap-10">
        <div>
          <Reveal>
            <h3 className="mb-6 font-serif text-4xl italic md:text-5xl">Education</h3>
          </Reveal>
          <ul className="border-b border-border">
            {p.education.map((e, i) => (
              <li key={e.institution}>
                <Reveal className="flex gap-5 border-t border-border py-6" delay={i * 0.06}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-xs text-primary/70">
                    {initials(e.institution)}
                  </span>
                  <div>
                    <p className="text-xl font-medium tracking-[-0.03em] md:text-2xl">{e.institution}</p>
                    <p className="mt-1 text-sm text-primary/60">{[e.degree, e.area].filter(Boolean).join(" · ")}</p>
                    {(e.start || e.end) && (
                      <p className="mt-1 text-xs text-primary/40">
                        {ym(e.start)}
                        {e.end ? " — " + ym(e.end) : ""}
                      </p>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Reveal>
            <h3 className="mb-6 font-serif text-4xl italic md:text-5xl">Certifications</h3>
          </Reveal>
          <ul className="border-b border-border">
            {p.certifications.map((c, i) => (
              <li key={c.name}>
                <Reveal className="flex gap-5 border-t border-border py-6" delay={i * 0.06}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-black">✓</span>
                  <div>
                    <p className="text-xl font-medium tracking-[-0.03em] md:text-2xl">{c.name}</p>
                    <p className="mt-1 text-sm text-primary/60">{[c.issuer, ym(c.date)].filter(Boolean).join(" · ")}</p>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener" className="mt-1 inline-block text-xs underline underline-offset-4">
                        verify ↗
                      </a>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
