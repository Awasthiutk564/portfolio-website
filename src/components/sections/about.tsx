import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { WordsPullUpMultiStyle } from "@/components/ui/prisma-hero";
import { EASE, Reveal, SECTION_X } from "@/components/motion";
import { ym, type Profile } from "@/lib/profile";

const card = "h-full rounded-2xl border border-border bg-card p-6 md:rounded-[2rem] md:p-8";
const label = "text-sm text-primary/50";

function useClock(timeZone: string) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
}

export function About({ p }: { p: Profile }) {
  const b = p.basics;
  const edu = p.education[0];
  const clock = useClock(b.timezone || "Asia/Kolkata");

  let pct: number | null = null;
  if (edu?.start && edu?.end) {
    const s = new Date(edu.start + "-01").getTime(), f = new Date(edu.end + "-01").getTime();
    pct = Math.round(Math.max(0, Math.min(100, ((Date.now() - s) / (f - s)) * 100)));
  }

  return (
    <section id="about" className={`${SECTION_X} pb-24 pt-24 md:pb-36 md:pt-40`}>
      {/* the footnote for the hero's asterisk */}
      <Reveal>
        <p className={label}>
          * {b.name}. {b.label}.
        </p>
      </Reveal>

      <h2 className="mx-auto mt-10 max-w-[90rem] text-center font-medium leading-[0.95] tracking-[-0.05em] text-[9.5vw] md:mt-14 md:text-[5.4vw]">
        <WordsPullUpMultiStyle
          segments={[
            { text: "I build applied AI" },
            { text: "end to end", className: "font-serif font-normal italic tracking-[-0.02em]" },
            { text: "— train the model, shape the API, wire the frontend, and", className: "text-primary/35" },
            { text: "ship it.", className: "font-serif font-normal italic tracking-[-0.02em]" },
          ]}
        />
      </h2>

      <div className="mt-20 grid grid-cols-12 gap-3 md:mt-32 md:gap-4">
        {/* photo + live local time */}
        <Reveal className="col-span-12 md:col-span-5 md:row-span-3">
          <figure className="relative h-[460px] overflow-hidden rounded-2xl md:h-full md:min-h-[520px] md:rounded-[2rem]">
            <img
              src={"/" + (b.photo || "images/about-profile.jpg")}
              alt={b.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-[72%_center] transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04]"
            />
            <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-overlay" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/75" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 md:p-8">
              <div>
                <p className="text-2xl font-medium tracking-[-0.04em] md:text-3xl">{b.name}</p>
                <p className="mt-1 text-sm text-primary/70">{b.location}</p>
              </div>
              <p className="text-right">
                <span className="block font-mono text-lg tabular-nums md:text-xl" aria-label="Local time">{clock}</span>
                <span className="text-xs text-primary/60">local time</span>
              </p>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal className="col-span-12 md:col-span-7" delay={0.08}>
          <article className={card}>
            <p className={label}>Now building</p>
            <p className="mt-4 text-3xl font-medium leading-[0.95] tracking-[-0.045em] md:text-[2.6vw]">{p.now?.building}</p>
            <ul className="mt-6 space-y-2 text-sm text-primary/65 md:text-base">
              {(p.now?.improving || []).map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="text-primary/35">*</span>
                  {x}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal className="col-span-12 sm:col-span-7 md:col-span-4" delay={0.16}>
          <article className={card}>
            <p className={label}>Education</p>
            {edu && (
              <>
                <p className="mt-4 text-2xl font-medium leading-none tracking-[-0.04em]">{edu.institution}</p>
                <p className="mt-2 text-sm text-primary/60">{[edu.degree, edu.area].filter(Boolean).join(" · ")}</p>
                {pct !== null && (
                  <div className="mt-6">
                    <div className="h-1 overflow-hidden rounded-full bg-primary/10">
                      <motion.span
                        className="block h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-primary/50">
                      <span>{ym(edu.start)}</span>
                      <span>{pct}% complete</span>
                      <span>{ym(edu.end)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </article>
        </Reveal>

        <Reveal className="col-span-12 sm:col-span-5 md:col-span-3" delay={0.24}>
          <article className={`${card} flex flex-col justify-between gap-8`}>
            <p className={label}>Status</p>
            <p className="flex items-start gap-3 text-xl font-medium leading-[1.05] tracking-[-0.03em]">
              <span className="relative mt-2 flex h-2 w-2 shrink-0">
                <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-primary" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {b.availability || "Open to opportunities"}
            </p>
          </article>
        </Reveal>

        <Reveal className="col-span-12 md:col-span-7" delay={0.1}>
          <article className={card}>
            <p className={label}>Focus areas</p>
            <div className="mt-6 grid gap-8 sm:grid-cols-3">
              {p.focus.map((f) => (
                <div key={f.title}>
                  <h3 className="font-serif text-3xl italic">{f.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-primary/65">
                    {f.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
