// Motion primitives shared by every section. They reuse the PrismaHero curve
// and offsets so scrolling the page feels like the hero's entrance.
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { WordsPullUp } from "@/components/ui/prisma-hero";
import { cn } from "@/lib/utils";

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SECTION_X = "px-4 sm:px-6 md:px-10";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Same pull-up as the hero's paragraph and button, triggered on scroll. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SectionHeadProps {
  index: string;
  label: string;
  title: string;
  sub?: React.ReactNode;
}

export function SectionHead({ index, label, title, sub }: SectionHeadProps) {
  return (
    <header className="mb-14 grid grid-cols-12 items-end gap-4 md:mb-24">
      <Reveal className="col-span-12 md:col-span-3 md:pb-[0.6vw]">
        <p className="text-sm text-primary/50">
          ({index}) {label}
        </p>
      </Reveal>
      <div className="col-span-12 md:col-span-9">
        <h2 className="font-medium leading-[0.85] tracking-[-0.065em] text-[15vw] sm:text-[12vw] md:text-[8vw] lg:text-[7vw]">
          <WordsPullUp text={title} showAsterisk />
        </h2>
        {sub && (
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-xl text-sm text-primary/60 md:text-base" style={{ lineHeight: 1.3 }}>
              {sub}
            </p>
          </Reveal>
        )}
      </div>
    </header>
  );
}

/** Counts up to `value` once it scrolls into view. */
export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => (el.textContent = Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      0
    </span>
  );
}
