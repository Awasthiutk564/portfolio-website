// Live ASCII portrait: the photo is sampled into a character grid that types
// itself in row by row, then reacts to the cursor -- cells near the pointer
// light up in the accent colour and scramble, and a click sends a ripple out.

import { reduced } from "./util.js";

const RAMP = " .`:-=+*cs#%@";         // bright (sparse) -> dark (dense)
const GLYPHS = "01<>/\\{}[]#%@$&*+=?";
const GAMMA = 0.95, WHITE_FLOOR = 0.92;

export function ascii(canvas, src) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  let cols, rows, cw, ch, cells = [], W = 0, H = 0, dpr = 1;
  let mouse = { x: -1e4, y: -1e4, in: false };
  let ripples = [], start = 0, running = false, visible = true, lastGlitch = 0;

  function sample() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = W < 420 ? 58 : 76;
    cw = W / cols;
    ch = cw / 0.58;                    // monospace cells are taller than wide
    rows = Math.floor(H / ch);

    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const o = off.getContext("2d", { willReadFrequently: true });
    o.fillStyle = "#fff"; o.fillRect(0, 0, cols, rows);
    // cover-fit in real pixels, then convert to cells (a cell is cw x ch px)
    const s = Math.max(W / img.width, (rows * ch) / img.height);
    const dw = (img.width * s) / cw, dh = (img.height * s) / ch;
    o.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    const px = o.getImageData(0, 0, cols, rows).data;

    cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const lum = Math.pow((px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255, GAMMA);
        const d = lum >= WHITE_FLOOR ? 0 : Math.round((1 - lum) * (RAMP.length - 1));
        cells.push({ x, y, d, ch: RAMP[d] });
      }
    }
    ctx.font = `${(ch * 0.82).toFixed(1)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const typed = reduced ? rows : Math.min(rows, ((t - start) / 28) | 0); // rows revealed so far
    const R = Math.max(70, W * 0.17);

    for (const c of cells) {
      if (c.y > typed) break;
      const cx = c.x * cw + cw / 2, cy = c.y * ch + ch / 2;
      let glyph = c.ch, color = null, alpha = 0.25 + (c.d / (RAMP.length - 1)) * 0.75;

      // cursor lens
      const dist = Math.hypot(cx - mouse.x, cy - mouse.y);
      let heat = mouse.in ? Math.max(0, 1 - dist / R) : 0;
      // click ripples
      for (const r of ripples) {
        const ring = Math.abs(Math.hypot(cx - r.x, cy - r.y) - r.r);
        if (ring < 18) heat = Math.max(heat, (1 - ring / 18) * r.life);
      }
      if (heat > 0.02) {
        if (c.d === 0 && heat < 0.55) continue;
        if (Math.random() < heat * 0.35) glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else if (c.d === 0) glyph = RAMP[1 + ((Math.random() * 3) | 0)];
        color = heat > 0.5 ? "#7ff5e2" : "#a78bfa";
        alpha = Math.min(1, alpha + heat);
      } else if (c.d === 0) continue;

      if (c.y === typed && !reduced) { color = "#5eead4"; glyph = "▊"; } // typing cursor row
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color || "#c9d1d9";
      ctx.fillText(glyph, c.x * cw, c.y * ch);
    }
    ctx.globalAlpha = 1;

    ripples = ripples.filter((r) => (r.r += 6, r.life -= 0.018) > 0);
    // idle: a few cells flicker now and then so it never looks frozen
    if (!reduced && t - lastGlitch > 90 && typed >= rows) {
      lastGlitch = t;
      for (let k = 0; k < 6; k++) {
        const c = cells[(Math.random() * cells.length) | 0];
        if (c && c.d > 2) { c.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0]; setTimeout(() => (c.ch = RAMP[c.d]), 140); }
      }
    }
  }

  function loop(t) {
    if (!visible) { running = false; return; }
    draw(t);
    requestAnimationFrame(loop);
  }
  function kick() { if (!running && visible) { running = true; requestAnimationFrame(loop); } }

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  canvas.addEventListener("pointermove", (e) => { mouse = { ...pos(e), in: true }; });
  canvas.addEventListener("pointerleave", () => { mouse.in = false; });
  canvas.addEventListener("pointerdown", (e) => { ripples.push({ ...pos(e), r: 0, life: 1 }); });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(sample, 150); });

  img.onload = () => {
    sample();
    start = performance.now();
    if (reduced) draw(start); else kick();
  };
  img.src = src;
}
