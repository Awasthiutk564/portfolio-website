import { Counter, Reveal, SECTION_X } from "@/components/motion";
import type { Profile } from "@/lib/profile";

export function Stats({ p }: { p: Profile }) {
  const t = p.github?.totals || {};
  const items = [
    { value: t.repos ?? 0, label: "public repos" },
    { value: t.contributions ?? 0, label: "contributions / yr" },
    { value: t.stars ?? 0, label: "GitHub stars" },
    { value: p.certifications.length, label: "certifications" },
    { value: t.longest_streak ?? 0, label: "day longest streak" },
  ];

  return (
    <section aria-label="Live numbers" className={SECTION_X}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 border-y border-border py-14 md:grid-cols-5 md:py-20">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.08} className={i === items.length - 1 ? "col-span-2 md:col-span-1" : ""}>
            <p className="font-medium leading-[0.85] tracking-[-0.07em] text-[19vw] md:text-[7.5vw]">
              <Counter value={it.value} />
            </p>
            <p className="mt-3 text-sm text-primary/50">{it.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
