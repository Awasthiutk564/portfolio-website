// small shared helpers

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2025-12" -> "Dec 2025", "2025" -> "2025", null -> "" */
export function ym(v) {
  if (!v) return "";
  const [y, m] = String(v).split("-");
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
}
export function range(start, end) {
  const s = ym(start);
  if (!s && !end) return "";
  return `${s || "?"} — ${end ? ym(end) : '<span class="now">Present</span>'}`;
}
export function ago(iso) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [n, u] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
}
export const initials = (s) => String(s || "").split(/[\s,.&/-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// GitHub's language colours for the handful that show up here
export const LANG_COLORS = {
  Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a", C: "#555555", "C++": "#f34b7d",
  HTML: "#e34c26", CSS: "#563d7c", Jupyter: "#DA5B0B", "Jupyter Notebook": "#DA5B0B", Shell: "#89e051",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", MATLAB: "#e16737", Dart: "#00B4AB",
};
export const langColor = (l) => LANG_COLORS[l] || "#8a92a3";

/** run cb once when el scrolls into view */
export function onView(el, cb, threshold = 0.2) {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
  }, { threshold });
  io.observe(el);
}
