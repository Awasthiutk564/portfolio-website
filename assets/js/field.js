// Ambient "neural net" behind the page: drifting nodes, edges between close
// neighbours, and the cursor acts as an extra node that pulls edges toward it.

import { reduced } from "./util.js";

export function field(canvas) {
  const ctx = canvas.getContext("2d");
  let W, H, dpr, nodes = [], mouse = { x: -1e4, y: -1e4 }, scrollY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (W * H) / 16000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6, hue: Math.random() < 0.7 ? "94,234,212" : "167,139,250",
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const fade = Math.max(0.25, 1 - scrollY / (H * 1.4)); // quieter once you scroll into content
    const LINK = 130;
    for (const a of nodes) {
      if (!reduced) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
        if (d < 180) { a.x += dx * 0.004; a.y += dy * 0.004; }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${a.hue},${(1 - d / LINK) * 0.16 * fade})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 200) {
        ctx.strokeStyle = `rgba(94,234,212,${(1 - dm / 200) * 0.35 * fade})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${a.hue},${0.55 * fade})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function loop() {
    if (!document.hidden) frame();
    requestAnimationFrame(loop);
  }

  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  if (reduced) frame(); else loop();
}
