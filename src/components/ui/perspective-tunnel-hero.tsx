// Perspective Tunnel Hero by daiwiikharihar on 21st.dev
// (https://21st.dev/@daiwiikharihar/components/perspective-tunnel-hero).
// Changes for this site: the cards, heading and copy are props; the flight can
// be driven from outside through `progress` (the page scroll flies it, so the
// wheel is never trapped); the stagger adapts to however many cards there are;
// cards can be rendered by the caller; colours are the site's black, cream and
// ember instead of neutral/indigo; the pointer pan only listens while on screen.
import {
  motion,
  useInView,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export interface TunnelItem {
  title: string;
  /** Small line on the card, e.g. a category. */
  label?: string;
  /** Image for the default card. */
  src?: string;
}

interface TunnelCardData {
  item: TunnelItem;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
}

/** Cards spiral out on the golden angle, so no two line up behind each other. */
function layout(items: TunnelItem[]): TunnelCardData[] {
  return items.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    const radiusFactorX = 0.28 + (i % 3) * 0.08;
    const radiusFactorY = 0.26 + (i % 2) * 0.09;
    return {
      item,
      angleCos: Math.cos(goldenAngle),
      angleSin: Math.sin(goldenAngle),
      radiusFactorX,
      radiusFactorY,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
  width: number;
  height: number;
  isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

interface TunnelCardProps {
  card: TunnelCardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: StageDimensions;
  render?: (item: TunnelItem, index: number) => React.ReactNode;
}

function TunnelCard({ card, progress, pointer, total, stage, render }: TunnelCardProps) {
  // Each card flies for `staggerSpan` of the run. The original's 0.55 suits its
  // nine cards; with more, the span shrinks so roughly the same number are in
  // the air at once instead of the whole deck.
  const staggerSpan = Math.min(0.55, 9 / (total + 9));
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  const localProgress = useTransform(progress, [start, end], [0, 1]);

  const farZ = stage.isMobile ? -1200 : -1700;
  const nearZ = stage.isMobile ? 350 : 500;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

  const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

  const cardWidth = stage.isMobile
    ? Math.max(130, Math.min(180, stage.width * 0.38))
    : Math.max(180, Math.min(270, stage.width * 0.18));

  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const panStrength = stage.isMobile ? 20 : 45;

  const transform = useTransform([z, pointer.x, pointer.y], ([currZ, px, py]: number[]) => {
    const offsetX = baseX - px * panStrength;
    const offsetY = baseY - py * panStrength;
    return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  return (
    <motion.div
      style={{
        width: cardWidth,
        transform,
        opacity,
        zIndex: card.index + 1,
      }}
      className="pointer-events-auto absolute left-1/2 top-1/2 aspect-[4/5] select-none will-change-transform"
    >
      {render ? (
        render(card.item, card.index)
      ) : (
        <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-card shadow-2xl shadow-black/90 ring-1 ring-primary/15 transition-all duration-500 hover:ring-ember/70">
          {card.item.src && (
            <img
              src={card.item.src}
              alt={card.item.title}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 sm:p-5">
            <span className="font-mono text-xs uppercase tracking-widest text-primary/95 drop-shadow-md sm:text-sm">
              {card.item.title}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export interface PerspectiveTunnelHeroProps {
  items: TunnelItem[];
  /** Drive the flight from outside (0 = start, 1 = through). Without it the
      component flies on the wheel inside itself, as the original does. */
  progress?: MotionValue<number>;
  /** Draws a card's face; the default is the original image card. */
  renderCard?: (item: TunnelItem, index: number) => React.ReactNode;
  eyebrow?: React.ReactNode;
  heading?: React.ReactNode;
  subtitle?: React.ReactNode;
  prompt?: React.ReactNode;
  className?: string;
}

export default function PerspectiveTunnelHero({
  items,
  progress,
  renderCard,
  eyebrow = "Warp Drive Sequence",
  heading = (
    <>
      INTO THE
      <br />
      ETHER.
    </>
  ),
  subtitle = "Scroll your trackpad or mouse wheel to fly through the spatial 3D corridor.",
  prompt = "Scroll to Explore",
  className = "",
}: PerspectiveTunnelHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(containerRef);
  const cards = useMemo(() => layout(items), [items]);

  const [stage, setStage] = useState<StageDimensions>({
    width: 1440,
    height: 900,
    isMobile: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // The flight position: the caller's (page scroll), or this component's own
  // wheel-driven value; either way smoothed on a spring.
  const ownProgress = useMotionValue(0);
  const smoothProgress = useSpring(progress ?? ownProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
  });

  // Without an outside driver, wheel scrolling inside the container flies the
  // tunnel instead of the page (the original behaviour).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || progress) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const current = ownProgress.get();
      const delta = e.deltaY * 0.0008; // Adjust speed of tunnel travel here
      const next = Math.min(1, Math.max(0, current + delta));
      ownProgress.set(next);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [ownProgress, progress]);

  const pointer = useCameraParallax(!reduce && inView);

  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1, 1.3]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.08, 0.85, 1], [0.55, 1, 1, 0]);
  const promptOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-[100svh] w-full select-none items-center justify-center overflow-hidden bg-background text-primary ${className}`}
      style={{
        perspective: stage.isMobile ? "900px" : "1200px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Dot grid and a faint warm glow at the vanishing point */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(225,224,204,0.14)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(240,163,107,0.09)_0%,transparent_70%)]" />

      {/* Depth ring guides */}
      <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-primary/10" />

      {/* Central anchor typography */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className="pointer-events-none z-0 flex max-w-3xl flex-col items-center px-6 text-center"
      >
        <div className="mb-4 text-sm text-primary/50">{eyebrow}</div>
        <div className="font-medium leading-[0.85] tracking-[-0.065em] text-[15vw] sm:text-[12vw] md:text-[8vw] lg:text-[7vw]">
          {heading}
        </div>
        <div className="mt-5 max-w-[40ch] text-sm text-primary/60 sm:text-base" style={{ lineHeight: 1.3 }}>
          {subtitle}
        </div>
      </motion.div>

      {/* Scroll prompt */}
      <motion.div
        style={{ opacity: promptOpacity }}
        className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary/50"
      >
        <span>{prompt}</span>
        <div className="h-6 w-px bg-gradient-to-b from-ember to-transparent" />
      </motion.div>

      {/* 3D Z-space plane */}
      <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {cards.map((card) => (
          <TunnelCard
            key={card.index}
            card={card}
            progress={smoothProgress}
            pointer={pointer}
            total={cards.length}
            stage={stage}
            render={renderCard}
          />
        ))}
      </div>
    </div>
  );
}
