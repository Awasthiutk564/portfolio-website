import { Reveal, SECTION_X } from "@/components/motion";
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { ago, type Profile } from "@/lib/profile";
import { scrollToY } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

function Node({ name, when, note, out }: { name: string; when?: string | boolean | null; note: string; out?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", out ? "border-primary/60 bg-primary/[0.06]" : "border-border")}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <i className={cn("block h-1.5 w-1.5 rounded-full", out || when ? "bg-primary" : "bg-primary/25")} />
        {name}
      </p>
      <p className="mt-0.5 text-xs text-primary/50">
        {typeof when === "string" ? "synced " + (ago(when) || when) : note}
      </p>
    </div>
  );
}

const SANS = '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

export function Footer({ p }: { p: Profile }) {
  const b = p.basics;
  const s = p._meta?.sources || {};
  const arrow = <span className="self-center text-primary/30" aria-hidden="true">→</span>;
  const profile = (network: string) => b.profiles.find((x) => x.network === network)?.url;
  const github = profile("GitHub");
  const linkedin = profile("LinkedIn");

  return (
    <>
      <section aria-label="How this page stays current" className={`${SECTION_X} pb-16 pt-20 md:pb-20 md:pt-28`}>
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
      </section>

      {/* the name printed in halftone dots; they part around the cursor and warm to ember */}
      <HalftoneWordmarkFooter
        wordmark={b.name.split(" ")[0].toLowerCase()}
        label={b.name}
        meta={`©${new Date().getFullYear()} · ${(b.location || "").split(",")[0]}`}
        columns={[
          {
            title: "Site",
            links: [
              { label: "About", href: "#about" },
              { label: "Work", href: "#work" },
              { label: "Experience", href: "#experience" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Elsewhere",
            links: [
              ...(github ? [{ label: "GitHub", href: github, external: true }] : []),
              ...(linkedin ? [{ label: "LinkedIn", href: linkedin, external: true }] : []),
              ...(p._meta?.resume_pdf ? [{ label: "Résumé", href: "/resume.pdf", external: true }] : []),
              { label: "Source ↗", href: "https://github.com/Awasthiutk564/portfolio-website", external: true },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: b.email, href: `mailto:${b.email}` },
              { label: "Send a message", href: "#contact" },
            ],
          },
        ]}
        note={<>Hero, wheel, orb &amp; footer from 21st.dev · ⌘K to search</>}
        palette={{ background: "#000000", ink: "#e1e0cc", warm: "#f0a36b" }}
        fontFamily={SANS}
        fontWeight={600}
        height="clamp(380px, 40vw, 560px)"
        onBackToTop={() => scrollToY(0)}
      />
    </>
  );
}
