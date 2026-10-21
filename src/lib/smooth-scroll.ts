// Inertial wheel scrolling (Lenis), so the page glides instead of stepping and
// the scroll-linked motion in the sections follows it smoothly. Only loaded for
// a mouse or trackpad: touch keeps the phone's native momentum, and
// reduced-motion users keep plain scrolling.
import type Lenis from "lenis";
import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;

// in-page jumps travel on an expo-out, the feel of EASE in components/motion.tsx
const glide = { duration: 1.2, easing: (t: number) => 1 - Math.pow(2, -10 * t) };

export function startSmoothScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches) return () => {};
  let stop = () => {};
  let cancelled = false;
  import("lenis").then(({ default: Lenis }) => {
    if (!cancelled) stop = attach(new Lenis({ autoRaf: true }));
  });
  return () => {
    cancelled = true;
    stop();
  };
}

function attach(l: Lenis) {
  lenis = l;

  // Mouse clicks on "#section" links glide there (honouring scroll-padding-top).
  // Keyboard activation (detail 0) keeps the native jump, which also moves
  // focus to the target: the skip link depends on that.
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const el = a && document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    l.scrollTo(el, glide);
    history.pushState(null, "", a.hash);
  };
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    l.destroy();
    lenis = null;
  };
}

/** Scroll the page to a y position, gliding when smooth scroll is on. */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, glide);
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/** Freeze page scrolling (an overlay is open) or release it. */
export function lockScroll(on: boolean) {
  if (lenis) {
    if (on) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = on ? "hidden" : "";
}

/** Scroll to a section by id, gliding when smooth scroll is on. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, glide);
  else el.scrollIntoView({ behavior: "smooth" });
}
