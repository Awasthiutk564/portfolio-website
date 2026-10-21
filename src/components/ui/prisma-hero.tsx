// PrismaHero by rahil1202 on 21st.dev (https://21st.dev/@rahil1202/components/prisma-hero).
// Markup, classes and motion are the original's; the copy, nav links, video and
// CTA are props (defaulting to the original Prisma content) so the portfolio
// can fill them in. Added: the card recedes as you scroll past it, and tilts
// toward the cursor like a card held in the hand.
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
export interface PrismaNavItem {
  label: string;
  href: string;
}

interface PrismaHeroProps {
  title?: string;
  description?: React.ReactNode;
  navItems?: PrismaNavItem[];
  ctaLabel?: string;
  ctaHref?: string;
  videoSrc?: string;
  /** replaces the default pill CTA; it gets the same pull-up entrance */
  cta?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const defaultNavItems: PrismaNavItem[] = ["Our story", "Collective", "Workshops", "Programs", "Inquiries"].map(
  (label) => ({ label, href: "#" }),
);

const PrismaHero = ({
  title = "Prisma",
  description = "Prisma is a worldwide network of visual artists, filmmakers and storytellers bound not by place, status or labels but by passion and hunger to unlock potential through our unique perspectives.",
  navItems = defaultNavItems,
  ctaLabel = "Join the lab",
  ctaHref = "#",
  videoSrc = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
  cta,
  className,
  titleClassName,
}: PrismaHeroProps) => {
  // a looping background video is motion too: hold it on its first frame
  const reduceMotion = useReducedMotion();

  // Scrolling away, the card sinks back (shrinking toward its bottom edge), the
  // video lags behind it and the copy fades: 0 = hero at the top, 1 = gone.
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "8.3%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  // Cursor tilt: px/py run -1..1 across the card and settle on a spring. The
  // card turns a few degrees toward the pointer, the video behind shifts the
  // other way and the copy in front follows it, so the layers read as depth;
  // a soft glare tracks the pointer. Mouse or trackpad only.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 120, damping: 18, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const rotateY = useTransform(sx, [-1, 1], [-2.2, 2.2]);
  const rotateX = useTransform(sy, [-1, 1], [1.6, -1.6]);
  const videoX = useTransform(sx, [-1, 1], [14, -14]);
  const videoYTilt = useTransform(sy, [-1, 1], [8, -8]);
  const copyX = useTransform(sx, [-1, 1], [-8, 8]);
  const glareX = useTransform(sx, [-1, 1], [0, 100]);
  const glareY = useTransform(sy, [-1, 1], [0, 100]);
  const glareOn = useSpring(0, { stiffness: 80, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(55% 65% at ${glareX}% ${glareY}%, rgba(255,255,255,0.32), transparent 70%)`;

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    glareOn.set(1);
  };
  const untilt = () => {
    px.set(0);
    py.set(0);
    glareOn.set(0);
  };

  return (
    <section ref={ref} className={cn("h-screen w-full", className)} onPointerMove={tilt} onPointerLeave={untilt}>
      <motion.div
        className="h-full w-full origin-bottom [perspective:1400px]"
        style={reduceMotion ? undefined : { scale: cardScale }}
      >
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem]"
        style={reduceMotion ? undefined : { rotateX, rotateY }}
      >

        {/* Background video: taller and wider than the card so it can drift with
            the scroll and the cursor without showing an edge */}
        <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { x: videoX, y: videoYTilt }}>
          <motion.video
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute -left-[3%] -top-[10%] h-[120%] w-[106%] max-w-none object-cover"
            style={reduceMotion ? undefined : { y: videoY }}
            src={videoSrc}
          />
        </motion.div>

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Glare that follows the cursor */}
        {!reduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: glare, opacity: glareOn }}
          />
        )}

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-label="Sections">
          <div className="flex items-center gap-3 rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="whitespace-nowrap rounded-sm text-[10px] transition-colors focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#E1E0CC] sm:text-xs md:text-sm"
                style={{ color: "rgba(225, 224, 204, 0.8)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                onFocus={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                onBlur={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10"
          style={reduceMotion ? undefined : { opacity: copyOpacity, y: copyY, x: copyX }}
        >
          <div className="grid grid-cols-12 items-end gap-4">

            <div className="col-span-12 lg:col-span-8">
              <h1
                className={cn(
                  "font-medium leading-[0.85] tracking-[-0.07em] text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]",
                  titleClassName,
                )}
                style={{ color: "#E1E0CC" }}
              >
                <WordsPullUp text={title} showAsterisk />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-primary/70 sm:text-sm md:text-base"
                style={{ lineHeight: 1.2 }}
              >
                {description}
              </motion.p>

              {cta ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="self-start"
                >
                  {cta}
                </motion.div>
              ) : (
              <motion.a
                href={ctaHref}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:text-base"
              >
                {ctaLabel}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4" style={{ color: "#E1E0CC" }} />
                </span>
              </motion.a>
              )}

            </div>
          </div>
        </motion.div>
      </motion.div>
      </motion.div>
    </section>
  );
};

export { PrismaHero };
