// ⌘K / Ctrl+K command palette.

import { $, esc } from "./util.js";

export function palette(p, actions) {
  const root = $("#palette"), input = $("#palette-input"), list = $("#palette-list");
  const b = p.basics;
  const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const items = [
    { ic: "#", label: "About", hint: "section", run: go("about") },
    { ic: "#", label: "Projects", hint: "section", run: go("work") },
    { ic: "#", label: "Experience", hint: "section", run: go("experience") },
    { ic: "#", label: "Skills", hint: "section", run: go("skills") },
    { ic: "#", label: "GitHub activity", hint: "section", run: go("activity") },
    { ic: ">_", label: "Open terminal", hint: "section", run: () => { go("terminal")(); setTimeout(() => $("#term-input").focus({ preventScroll: true }), 600); } },
    { ic: "@", label: "Contact", hint: "section", run: go("contact") },
    { ic: "✉", label: "Copy email address", hint: b.email, run: actions.copyEmail },
    { ic: "↓", label: "Open résumé", hint: "pdf", run: () => window.open("/resume.pdf", "_blank", "noopener"), hidden: !p._meta?.resume_pdf },
    { ic: "✦", label: "Ask Booglu (AI assistant)", hint: "chat", run: actions.openChat },
    ...(b.profiles || []).map((x) => ({ ic: "↗", label: `Open ${x.network}`, hint: x.username, run: () => window.open(x.url, "_blank", "noopener") })),
    ...p.projects.slice(0, 14).map((x) => ({ ic: "◆", label: x.title, hint: "project", run: () => window.open(x.url, "_blank", "noopener") })),
  ].filter((i) => !i.hidden);
  let shown = items, sel = 0;

  // subsequence match, earlier/contiguous hits rank higher
  const score = (q, s) => {
    s = s.toLowerCase();
    if (s.includes(q)) return 100 - s.indexOf(q);
    let i = 0;
    for (const c of s) if (c === q[i]) i++;
    return i === q.length ? 10 : -1;
  };

  function render() {
    list.innerHTML = shown.map((it, i) =>
      `<li role="option" aria-selected="${i === sel}" data-i="${i}"><span class="ic">${esc(it.ic)}</span>${esc(it.label)}<small>${esc(it.hint || "")}</small></li>`).join("")
      || `<li aria-selected="false"><span class="ic">?</span>No matches</li>`;
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }
  function filter() {
    const q = input.value.trim().toLowerCase();
    shown = !q ? items : items.map((it) => [score(q, it.label + " " + (it.hint || "")), it]).filter(([s]) => s >= 0).sort((a, b) => b[0] - a[0]).map(([, it]) => it);
    sel = 0; render();
  }
  function open() { root.hidden = false; input.value = ""; filter(); input.focus(); }
  function close() { root.hidden = true; }
  function pick(i) { const it = shown[i]; if (!it) return; close(); it.run(); }

  input.addEventListener("input", filter);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
    else if (e.key === "Escape") close();
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) pick(+li.dataset.i); });
  root.addEventListener("click", (e) => { if (e.target === root) close(); });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); root.hidden ? open() : close(); }
    else if (e.key === "/" && root.hidden && !/input|textarea/i.test(document.activeElement?.tagName)) { e.preventDefault(); open(); }
  });
  $("#open-palette").addEventListener("click", open);
}
