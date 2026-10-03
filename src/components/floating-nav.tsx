// The hero's notch navbar, pinned to the top once the hero scrolls away.
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { PrismaNavItem } from "@/components/ui/prisma-hero";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

export function FloatingNav({ items, onSearch }: { items: PrismaNavItem[]; onSearch: () => void }) {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
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

  return (
    <div className="fixed left-1/2 top-0 z-40 -translate-x-1/2">
      <AnimatePresence>
        {show && (
          <motion.nav
            aria-label="Sections"
            initial={{ y: "-110%" }}
            animate={{ y: 0 }}
            exit={{ y: "-110%" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-3 rounded-b-2xl border border-t-0 border-border bg-black px-4 py-2 sm:gap-6 md:gap-10 md:rounded-b-3xl md:px-8"
          >
            {items.map((item) => {
              const on = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap rounded-sm py-1 text-[10px] transition-colors focus-visible:outline-1 focus-visible:outline-offset-4 sm:text-xs md:text-sm",
                    on ? "text-primary" : "text-primary/70 hover:text-primary",
                  )}
                >
                  {item.label}
                  {on && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  )}
                </a>
              );
            })}
            <button
              type="button"
              onClick={onSearch}
              aria-label="Open command palette"
              className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-primary/70 transition-colors hover:text-primary sm:flex"
            >
              <Search className="h-3 w-3" />
              <kbd className="font-mono">⌘K</kbd>
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
