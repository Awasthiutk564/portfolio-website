// Liquid-metal glass pill: a chrome rim that spins, molten metal that flows
// under a glass gloss (warped by the #liquid-metal SVG filter in <LiquidMetalDefs/>),
// and a light sheen that sweeps across on hover. Same pill shape as the Prisma CTA.
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "chrome" | "obsidian";
type Size = "md" | "sm";

interface Common {
  tone?: Tone;
  size?: Size;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

type LinkProps = Common & Omit<HTMLMotionProps<"a">, "children" | "className"> & { href: string };
type ButtonProps = Common & Omit<HTMLMotionProps<"button">, "children" | "className"> & { href?: undefined };

function Inner({ tone = "chrome", size = "md", icon, children }: Common) {
  return (
    <>
      <span aria-hidden className="liquid-rim absolute inset-0 rounded-full" />
      <span
        className={cn(
          "relative inline-flex items-center overflow-hidden rounded-full font-medium transition-[gap] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:gap-3",
          size === "md" ? "gap-2 py-1 pl-5 pr-1 text-sm sm:text-base" : "gap-2 py-0.5 pl-4 pr-0.5 text-sm",
          !icon && (size === "md" ? "py-2.5 pr-5" : "py-1.5 pr-4"),
          tone === "chrome" ? "text-black" : "text-primary",
        )}
      >
        <span aria-hidden className={cn("liquid-metal absolute -inset-[30%]", tone === "obsidian" && "liquid-metal-dark")} />
        <span aria-hidden className={cn("liquid-gloss absolute inset-0 rounded-full", tone === "obsidian" && "liquid-gloss-dark")} />
        <span aria-hidden className="liquid-sheen absolute inset-y-0 -left-1/2 w-1/3" />
        <span className={cn("relative z-10 whitespace-nowrap", tone === "chrome" ? "liquid-text" : "liquid-text-dark")}>{children}</span>
        {icon && (
          <span
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-rotate-12",
              size === "md" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-7 w-7",
              tone === "chrome" ? "bg-black text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]" : "bg-primary text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]",
            )}
          >
            {icon}
          </span>
        )}
      </span>
    </>
  );
}

const shell = (tone: Tone, className?: string) =>
  cn(
    "liquid-btn group relative inline-flex select-none rounded-full p-[1.5px] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-60",
    tone === "chrome" ? "liquid-glow focus-visible:outline-primary" : "liquid-glow-dark focus-visible:outline-black",
    className,
  );

export function LiquidButton(props: LinkProps | ButtonProps) {
  const reduce = useReducedMotion();
  const { tone = "chrome", size, icon, className, children, ...rest } = props;
  const tap = reduce ? undefined : { scale: 0.96 };
  const inner = <Inner tone={tone} size={size} icon={icon}>{children}</Inner>;

  if (props.href !== undefined) {
    return (
      <motion.a whileTap={tap} {...(rest as HTMLMotionProps<"a">)} className={shell(tone, className)}>
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button whileTap={tap} type="button" {...(rest as HTMLMotionProps<"button">)} className={shell(tone, className)}>
      {inner}
    </motion.button>
  );
}

/** The SVG filter that makes the metal ripple. Render once near the root. */
export function LiquidMetalDefs() {
  const reduce = useReducedMotion();
  return (
    <svg width="0" height="0" aria-hidden="true" className="pointer-events-none absolute">
      <filter id="liquid-metal" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="2" seed="7" result="noise">
          {!reduce && (
            <animate attributeName="baseFrequency" dur="14s" values="0.008 0.022;0.014 0.032;0.008 0.022" repeatCount="indefinite" />
          )}
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
