// The hero's notch navbar, floating as a Liquid Glass capsule once the page
// scrolls. A glass lens marks the section on screen and slides on a spring to
// whichever link the cursor or keyboard is on.
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { PrismaNavItem } from "@/components/ui/prisma-hero";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";

const DROP = { type: "spring", stiffness: 420, damping: 30, mass: 0.9 } as const;
const LENS = { type: "spring", stiffness: 520, damping: 34 } as const;

export function FloatingNav({ items, onSearch }: { items: PrismaNavItem[]; onSearch: () => void }) {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState("");
  const [hover, setHover] = useState<string | null>(null);

  // out as soon as the page moves; the hero's notch fades as this drops in
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 24);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive("#" + e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.forEach((i) => {
      const el = document.querySelector(i.href);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  const lens = hover ?? active;

  return (
    <div className="fixed left-1/2 top-3 z-40 -translate-x-1/2 md:top-4">
      <AnimatePresence>
        {show && (
          // only transforms here: opacity or a filter on an ancestor would cut the glass off from the page
          <motion.nav
            aria-label="Sections"
            initial={{ y: -76, scale: 0.86 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -76, scale: 0.86 }}
            transition={DROP}
            onPointerLeave={() => setHover(null)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setHover(null);
            }}
          >
            <LiquidGlass className="flex items-center rounded-full p-1 md:p-1.5">
              {items.map((item) => {
                const on = active === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={on ? "true" : undefined}
                    onPointerEnter={() => setHover(item.href)}
                    onFocus={() => setHover(item.href)}
                    className={cn(
                      "relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] transition-colors duration-300 focus-visible:outline-1 focus-visible:-outline-offset-1 sm:px-3.5 sm:text-xs md:px-4 md:py-2 md:text-sm",
                      on || lens === item.href ? "text-primary" : "text-primary/70",
                    )}
                  >
                    {lens === item.href && (
                      <motion.span
                        layoutId="nav-lens"
                        aria-hidden="true"
                        className="liquid-lens absolute inset-0"
                        style={{ borderRadius: 999 }}
                        transition={LENS}
                      />
                    )}
                    <span className="relative [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">{item.label}</span>
                  </a>
                );
              })}
              <button
                type="button"
                onClick={onSearch}
                onPointerEnter={() => setHover(null)}
                onFocus={() => setHover(null)}
                aria-label="Open command palette"
                className="liquid-chip relative ml-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-primary/70 transition-colors hover:text-primary sm:flex"
              >
                <Search className="h-3 w-3" />
                <kbd className="font-mono">⌘K</kbd>
              </button>
            </LiquidGlass>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
