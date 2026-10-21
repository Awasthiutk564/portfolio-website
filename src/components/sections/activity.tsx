import { motion } from "framer-motion";
import { EASE, Reveal, SECTION_X, SectionHead } from "@/components/motion";
import ContributionSkyline from "@/components/ui/contribution-skyline";
import type { Profile } from "@/lib/profile";

// the skyline's four activity levels: the cream ramp the old heat map used,
// with the busiest days in ember so the tallest towers glow
const SKYLINE = ["#3f3d36", "#6f6d61", "#b0ae9c", "#f0a36b"];
// language shares as a ramp of the cream
const SHARE = [1, 0.7, 0.5, 0.36, 0.24, 0.14];

export function Activity({ p }: { p: Profile }) {
  const gh = p.github;
  const days = gh?.contributions || [];
  if (!gh || !days.length) return null;

  const langs = Object.entries(gh.languages || {});
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const top = langs.slice(0, 6);

  return (
    <section id="activity" className={`${SECTION_X} py-24 md:py-36`}>
      <SectionHead index="05" label="Activity" title="Commit history doesn't lie" />

      {/* the year flat, then rising into a skyline as it comes into view */}
      <Reveal>
        {/* a phone squeezes the year into ~330px, so its towers get taller to still read as a skyline */}
        <ContributionSkyline data={days} palette={SKYLINE} heightScale={matchMedia("(max-width: 639px)").matches ? 1.8 : 1} />
      </Reveal>

      {!!top.length && (
        <Reveal>
          <div className="mt-3 rounded-2xl border border-border bg-card p-6 md:mt-4 md:rounded-[2rem] md:p-10">
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
        </Reveal>
      )}
    </section>
  );
}
