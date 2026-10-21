// Liquid Glass, after the material in Apple's iOS 26: a capsule the page shows
// through, bent along the rim as if by a thick glass edge, frosted and lightly
// tinted, with a rim that catches the light from the cursor. The bending is an
// SVG displacement map fed to backdrop-filter, which only Chromium renders;
// Safari and Firefox get the frosted glass alone.
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** how far in from the rim the glass bends the page, and how far it shifts it there (px) */
const BEZEL = 18;
const BEND = 8;

const refracts = () => "userAgentData" in navigator && !matchMedia("(prefers-reduced-transparency: reduce)").matches;

/** The displacement map for a w×h capsule. Within BEZEL of the rim each pixel
    samples the backdrop further in along the rim's normal, strongest at the
    edge; red and green carry the x and y shift around a neutral 128. */
function rimMap(w: number, h: number) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(W, H);
  const r = h / 2;
  const hx = w / 2 - r;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const px = (i + 0.5) / dpr - w / 2;
      const py = (j + 0.5) / dpr - h / 2;
      // distance in from the rim, and the rim's outward normal
      const qx = Math.abs(px) - hx;
      const qy = Math.abs(py);
      let nx = 0;
      let ny = 1;
      let depth = r - qy;
      if (qx > 0) {
        const l = Math.hypot(qx, qy) || 1;
        nx = qx / l;
        ny = qy / l;
        depth = r - l;
      }
      const s = Math.min(1, Math.max(0, 1 - depth / BEZEL));
      const k = s * s * 127;
      const o = (j * W + i) * 4;
      img.data[o] = 128 - Math.sign(px) * nx * k;
      img.data[o + 1] = 128 - Math.sign(py) * ny * k;
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

const channel = (c: 0 | 1 | 2) =>
  [0, 1, 2, 3].map((row) => [0, 1, 2, 3, 4].map((col) => (row === col && (row === c || row === 3) ? 1 : 0)).join(" ")).join(" ");

export function LiquidGlass({ className, children, onPointerMove, onPointerLeave, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const id = "glass" + useId().replace(/[^\w-]/g, "");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const angle = useRef(-45);

  useEffect(() => {
    const el = ref.current;
    if (!el || !refracts()) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const map = useMemo(() => (size && size.w > 0 && size.h > 0 ? rimMap(size.w, size.h) : null), [size]);

  // the rim's highlight turns toward the cursor (0deg = up), unwrapped so it
  // never swings the long way round; a soft glare sits under the cursor
  const turn = (el: HTMLElement, to: number) => {
    angle.current += ((((to - angle.current) % 360) + 540) % 360) - 180;
    el.style.setProperty("--la", `${angle.current}deg`);
  };
  const light = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const b = el.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    turn(el, (Math.atan2(x / b.width - 0.5, 0.5 - y / b.height) * 180) / Math.PI);
    el.style.setProperty("--lx", `${x}px`);
    el.style.setProperty("--ly", `${y}px`);
  };
  const unlight = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    turn(e.currentTarget, -45);
  };

  return (
    <div ref={ref} {...rest} onPointerMove={light} onPointerLeave={unlight} className={cn("liquid-glass", className)}>
      {map && size && (
        <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
          <filter id={id} x="0" y="0" width={size.w} height={size.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={map} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
            {/* each colour bends a touch more than the last, a faint prism at the rim */}
            {([0, 1, 2] as const).map((c) => (
              <Fragment key={c}>
                <feDisplacementMap in="SourceGraphic" in2="map" scale={BEND * 2 * (1 + c * 0.08)} xChannelSelector="R" yChannelSelector="G" result={`d${c}`} />
                <feColorMatrix in={`d${c}`} type="matrix" values={channel(c)} result={`c${c}`} />
              </Fragment>
            ))}
            <feBlend in="c0" in2="c1" mode="screen" result="c01" />
            <feBlend in="c01" in2="c2" mode="screen" />
          </filter>
        </svg>
      )}
      <span
        aria-hidden="true"
        className="liquid-glass-fill"
        style={map ? { backdropFilter: `url(#${id}) blur(3px) saturate(180%) brightness(1.06)` } : undefined}
      />
      <span aria-hidden="true" className="liquid-glass-glare" />
      <span aria-hidden="true" className="liquid-glass-rim" />
      {children}
    </div>
  );
}
