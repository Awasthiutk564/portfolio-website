// Renders the whole page from /data/profile.json (built by the sync pipeline)
// and wires up the interactions.

import { $, $$, esc, ym, range, ago, initials, langColor, onView, reduced } from "./util.js";
import { ascii } from "./ascii.js";
import { field } from "./field.js";
import { terminal } from "./terminal.js";
import { palette } from "./palette.js";
import { chat } from "./chat.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadProfile() {
  const r = await fetch("/data/profile.json", { cache: "no-cache" });
  if (!r.ok) throw new Error(`profile.json ${r.status}`);
  return r.json();
}

/* ── boot sequence ─────────────────────────────────────────────── */
async function boot(p) {
  const el = $("#boot"), log = $("#boot-log");
  let seen = false;
  try { seen = sessionStorage.getItem("booted"); sessionStorage.setItem("booted", "1"); } catch {}
  if (reduced || seen) { el.classList.add("off"); return; }
  let skip = false;
  el.addEventListener("click", () => (skip = true));
  addEventListener("keydown", () => (skip = true), { once: true });
  const s = p._meta?.sources || {}, t = p.github?.totals || {};
  const lines = [
    `<b>utkarsh-os</b> v1.0 · booting portfolio`,
    `[ <i>ok</i> ] mounting /home/utkarsh`,
    `[ <i>ok</i> ] loading profile.json  <span>(built ${ago(p._meta?.built_at)})</span>`,
    `[ <i>ok</i> ] github   → ${t.repos ?? "?"} repos · ${t.contributions ?? "?"} contributions`,
    `[ <i>ok</i> ] linkedin → ${s.linkedin ? "imported " + s.linkedin : "baseline profile"}`,
    `[ <i>ok</i> ] résumé   → ${s.resume ? "parsed " + s.resume : "baseline profile"}`,
    `[ <i>ok</i> ] starting interface…`,
  ];
  for (const l of lines) {
    if (skip) break;
    log.innerHTML += l + "\n";
    await sleep(150 + Math.random() * 110);
  }
  if (!skip) await sleep(220);
  el.classList.add("done");
  setTimeout(() => el.classList.add("off"), 600);
}

/* ── hero ──────────────────────────────────────────────────────── */
function decode(el, text) {
  if (reduced) { el.textContent = text; return; }
  const chars = "!<>-_\\/[]{}—=+*^?#01";
  let frame = 0;
  const total = 38;
  const tick = () => {
    const done = Math.floor((frame / total) * text.length);
    el.innerHTML = [...text].map((c, i) => i < done || c === " " ? esc(c)
      : `<span class="glitch">${esc(chars[(Math.random() * chars.length) | 0])}</span>`).join("");
    if (frame++ < total) requestAnimationFrame(tick); else el.textContent = text;
  };
  tick();
}

async function rotate(el, words) {
  if (!words?.length) return;
  if (reduced) { el.textContent = words[0]; return; }
  for (let i = 0; ; i = (i + 1) % words.length) {
    const w = words[i];
    for (let k = 1; k <= w.length; k++) { el.textContent = w.slice(0, k); await sleep(55); }
    await sleep(1900);
    for (let k = w.length; k >= 0; k--) { el.textContent = w.slice(0, k); await sleep(26); }
    await sleep(250);
  }
}

function hero(p) {
  const b = p.basics;
  $("#hero-name").textContent = b.name;
  rotate($("#rotator"), b.roles);
  $("#hero-summary").textContent = b.summary;
  $("#availability").textContent = b.availability || "Open to opportunities";
  const built = p._meta?.built_at;
  $("#sync-text").textContent = `auto-synced ${ago(built)} · GitHub · LinkedIn · résumé`;
  if (!p._meta?.resume_pdf) {
    const rb = $("#resume-btn");
    rb.setAttribute("aria-disabled", "true");
    rb.title = "Résumé PDF coming soon";
  }
  ascii($("#ascii"), "/" + (b.image || "images/ascii-source.png"));
}

/* ── stats ─────────────────────────────────────────────────────── */
function stats(p) {
  const t = p.github?.totals || {};
  const vals = {
    repos: t.repos, contributions: t.contributions, stars: t.stars,
    certifications: p.certifications.length, streak: t.longest_streak,
  };
  $$("[data-count]").forEach((el) => {
    const target = vals[el.dataset.count] ?? 0;
    onView(el, () => {
      if (reduced) { el.textContent = target; return; }
      const t0 = performance.now(), dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * e).toLocaleString();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
}

/* ── about ─────────────────────────────────────────────────────── */
function about(p) {
  const b = p.basics;
  $("#about-summary").textContent = b.summary;
  if (b.photo) $("#about-photo").src = "/" + b.photo;

  const e = p.education[0];
  if (e) {
    let progress = "";
    if (e.start && e.end) {
      const s = new Date(e.start + "-01"), f = new Date(e.end + "-01");
      const pct = Math.max(0, Math.min(100, ((Date.now() - s) / (f - s)) * 100));
      progress = `<div class="meter"><span data-w="${pct.toFixed(0)}"></span></div>
        <div class="meter-label"><span>${esc(ym(e.start))}</span><span>${pct.toFixed(0)}% complete</span><span>${esc(ym(e.end))}</span></div>`;
    }
    $("#edu-current").innerHTML = `<div class="edu-big"><b>${esc(e.institution)}</b><span>${esc([e.degree, e.area].filter(Boolean).join(" · "))}</span></div>${progress}`;
    onView($("#edu-current"), (el) => $$(".meter span", el).forEach((s) => (s.style.width = s.dataset.w + "%")));
  }

  $("#now-building").textContent = p.now?.building || "";
  $("#now-improving").innerHTML = (p.now?.improving || []).map((x) => `<li>${esc(x)}</li>`).join("");
  $("#location").textContent = b.location || "";
  $("#focus").innerHTML = (p.focus || []).map((f) =>
    `<div><h4>${esc(f.title.toLowerCase())}/</h4><ul>${f.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");

  const tz = b.timezone || "Asia/Kolkata";
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tick = () => ($("#clock").textContent = fmt.format(new Date()));
  tick(); setInterval(tick, 1000);
}

/* ── projects ──────────────────────────────────────────────────── */
function projects(p) {
  const grid = $("#projects");
  const list = p.projects;
  const VISIBLE = 9;
  grid.innerHTML = list.map((x, i) => {
    const tags = [...new Set([...(x.tags || [])])].slice(0, 4);
    const filterKeys = [...new Set([x.language, ...(x.tags || [])].filter(Boolean))].join("|");
    return `<article class="project spot reveal${x.featured && i < 2 ? " feature" : ""}${i >= VISIBLE ? " extra hide" : ""}" data-tags="${esc(filterKeys)}">
      <div class="project-top">
        <span class="project-icon">${esc(initials(x.title))}</span>
        <span class="project-links">
          ${x.homepage ? `<a href="${esc(x.homepage)}" target="_blank" rel="noopener">live ↗</a>` : ""}
          <a href="${esc(x.url)}" target="_blank" rel="noopener" aria-label="${esc(x.title)} on GitHub">code ↗</a>
        </span>
      </div>
      <h3>${esc(x.title)}</h3>
      ${x.tagline ? `<p class="tagline">${esc(x.tagline)}</p>` : ""}
      <p class="desc">${esc(x.description || "")}</p>
      <div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="project-meta">
        ${x.language ? `<span><i class="lang-dot" style="background:${langColor(x.language)}"></i>${esc(x.language)}</span>` : ""}
        ${x.repo ? `<span title="stars">★ ${x.stars || 0}</span><span title="forks">⑂ ${x.forks || 0}</span>` : ""}
        ${x.pushed_at ? `<span class="push">updated ${esc(ago(x.pushed_at))}</span>` : ""}
      </div>
    </article>`;
  }).join("");

  if (list.length > VISIBLE) {
    const more = document.createElement("button");
    more.className = "btn btn-ghost more-btn";
    more.type = "button";
    more.textContent = `Show all ${list.length} projects`;
    more.onclick = () => { $$(".project.extra").forEach((e) => e.classList.remove("hide")); more.remove(); revealAll(); };
    grid.after(more);
  }

  // filters: the most common tags/languages across projects
  const counts = {};
  list.forEach((x) => new Set([x.language, ...(x.tags || [])].filter(Boolean)).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  const keys = Object.entries(counts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k]) => k);
  const bar = $("#filters");
  bar.innerHTML = ["All", ...keys].map((k, i) => `<button class="filter" role="tab" type="button" aria-selected="${i === 0}" data-k="${esc(k)}">${esc(k)}</button>`).join("");
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    $$(".filter", bar).forEach((b) => b.setAttribute("aria-selected", b === btn));
    const k = btn.dataset.k;
    $(".more-btn")?.remove();
    $$(".project", grid).forEach((card) => {
      const show = k === "All" ? !card.classList.contains("extra") || !$(".more-btn") : card.dataset.tags.split("|").includes(k);
      card.classList.toggle("hide", !show);
      if (show) card.classList.add("in");
    });
  });
}

/* ── experience / education / certs ───────────────────────────── */
function experience(p) {
  const tl = $("#timeline");
  tl.insertAdjacentHTML("beforeend", p.experience.map((e) => `
    <div class="tl-item reveal${e.end ? "" : " current"}">
      <div class="tl-card spot">
        <div class="tl-head"><h3>${esc(e.title)} <span>@ ${esc(e.company)}</span></h3><span class="tl-date">${range(e.start, e.end)}</span></div>
        ${e.location ? `<p class="tl-loc">${esc(e.location)}</p>` : ""}
        ${e.summary ? `<p class="sum">${esc(e.summary)}</p>` : ""}
        ${e.highlights?.length ? `<ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${e.tags?.length ? `<div class="tags">${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
    </div>`).join(""));

  $("#education").innerHTML = p.education.map((e) => `
    <div class="edu-item spot reveal"><span class="badge">${esc(initials(e.institution))}</span>
      <div><b>${esc(e.institution)}</b><span>${esc([e.degree, e.area].filter(Boolean).join(" · "))}</span>
      ${e.start || e.end ? `<span>${esc(ym(e.start))}${e.end ? " — " + esc(ym(e.end)) : ""}</span>` : ""}</div></div>`).join("");

  $("#certs").innerHTML = p.certifications.map((c) => `
    <div class="cert spot reveal"><span class="badge">✓</span>
      <div><b>${esc(c.name)}</b><span>${esc([c.issuer, ym(c.date)].filter(Boolean).join(" · "))}</span>
      ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">verify ↗</a>` : ""}</div></div>`).join("");
}

/* ── skills ────────────────────────────────────────────────────── */
function skills(p) {
  const icons = (p.skill_icons || "").split(",").filter(Boolean);
  const imgs = icons.map((i) => `<img src="https://skillicons.dev/icons?i=${encodeURIComponent(i)}" alt="" loading="lazy" width="54" height="54" />`).join("");
  $("#marquee").innerHTML = imgs + imgs; // doubled for a seamless loop
  $("#skill-groups").innerHTML = p.skills.map((s) => `
    <div class="card skill-group spot reveal"><h4>${esc(s.category.toLowerCase())}/</h4>
      <div class="tags">${s.items.map((i) => `<span class="tag">${esc(i)}</span>`).join("")}</div></div>`).join("");
}

/* ── activity: heatmap + languages ─────────────────────────────── */
function activity(p) {
  const gh = p.github;
  if (!gh?.contributions?.length) { $("#activity").hidden = true; return; }
  const days = gh.contributions;
  const nz = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = (f) => nz[Math.min(nz.length - 1, Math.floor(nz.length * f))] || 1;
  const cuts = [q(0.25), q(0.5), q(0.8)];
  const level = (c) => (!c ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4);
  const lead = new Date(days[0].date + "T00:00:00").getDay(); // sunday = 0
  const cells = Array.from({ length: lead }, () => `<i class="pad"></i>`).concat(days.map((d, i) => {
    const col = Math.floor((i + lead) / 7), row = (i + lead) % 7;
    return `<i class="l${level(d.count)}" style="transition-delay:${(col * 14 + row * 30)}ms" title="${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}"></i>`;
  }));
  const hm = $("#heatmap");
  hm.innerHTML = cells.join("");
  onView(hm, () => hm.classList.add("in"), 0.3);
  const t = gh.totals;
  $("#heatmap-total").innerHTML = `<b>${t.contributions.toLocaleString()}</b> contributions in the last year · longest streak <b>${t.longest_streak}</b> days`;
  // scroll the calendar to the latest weeks on narrow screens
  const wrap = $(".heatmap-wrap");
  wrap.scrollLeft = wrap.scrollWidth;

  const langs = Object.entries(gh.languages || {});
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const top = langs.slice(0, 6);
  $("#langs").innerHTML = `<div class="lang-bar">${top.map(([l, v]) => `<span data-w="${(v / total * 100).toFixed(1)}" style="background:${langColor(l)}" title="${esc(l)}"></span>`).join("")}</div>
    <div class="lang-keys">${top.map(([l, v]) => `<span><i class="lang-dot" style="background:${langColor(l)}"></i>${esc(l)} ${(v / total * 100).toFixed(1)}%</span>`).join("")}</div>`;
  onView($("#langs"), (el) => $$(".lang-bar span", el).forEach((s) => (s.style.width = s.dataset.w + "%")));
}

/* ── contact ───────────────────────────────────────────────────── */
function contact(p) {
  const b = p.basics;
  $("#email-text").textContent = b.email;
  $("#profiles").innerHTML = (b.profiles || []).map((x) =>
    `<a class="profile-link" href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.network)}</b><span>${esc(x.username)} ↗</span></a>`).join("");

  const form = $("#contact-form"), status = $("#form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!form.checkValidity()) { status.className = "form-status bad"; status.textContent = "✗ please fill every field with a valid email"; return; }
    const btn = $("button[type=submit]", form);
    btn.disabled = true; status.className = "form-status"; status.textContent = "sending…";
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      status.className = "form-status ok"; status.textContent = "✓ message delivered. I'll get back to you soon.";
      form.reset();
    } catch (err) {
      status.className = "form-status bad";
      status.textContent = `✗ ${err.message || "couldn't send"}. Email me directly instead.`;
    } finally { btn.disabled = false; }
  });
}

function copyEmail(p) {
  return async () => {
    const hint = $("#copy-hint");
    try { await navigator.clipboard.writeText(p.basics.email); hint.textContent = "✓ copied to clipboard"; }
    catch { location.href = `mailto:${p.basics.email}`; }
    setTimeout(() => (hint.textContent = "click to copy"), 2200);
  };
}

/* ── footer pipeline ───────────────────────────────────────────── */
function pipeline(p) {
  const s = p._meta?.sources || {};
  const node = (name, when, note) =>
    `<div class="pipe-node ${when ? "ok" : "idle"}"><b>${name}</b><span>${when ? "synced " + esc(ago(when) || when) : esc(note)}</span></div>`;
  $("#pipe").innerHTML = [
    node("GitHub API", s.github, "pending"),
    node("LinkedIn export", s.linkedin, "baseline data"),
    node("résumé.pdf → Gemini", s.resume, "baseline data"),
  ].join("") + `<span class="pipe-arrow">→</span>
    <div class="pipe-node ok"><b>GitHub Actions</b><span>merge → profile.json</span></div><span class="pipe-arrow">→</span>
    <div class="pipe-node out ok"><b>this page + Booglu</b><span>built ${esc(ago(p._meta?.built_at))}</span></div>`;
  $("#year").textContent = new Date().getFullYear();
}

/* ── global interactions ───────────────────────────────────────── */
function revealAll() {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal:not(.in)").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
}

function interactions() {
  // cursor spotlight on cards
  addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".spot");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  if (!reduced && matchMedia("(pointer: fine)").matches) {
    // 3D tilt on project cards and the portrait window
    $$(".project, .tilt").forEach((el) => {
      const max = el.classList.contains("tilt") ? 7 : 5;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateY(-3px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
    // magnetic buttons
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  // scroll: progress bar, nav state, timeline fill
  const bar = $("#progress"), nav = $("#nav"), fill = $("#timeline-fill"), tl = $("#timeline");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
    nav.classList.toggle("scrolled", h.scrollTop > 20);
    const r = tl.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height));
    fill.style.height = `${k * 100}%`;
    $$(".tl-item", tl).forEach((it) => it.classList.toggle("lit", it.getBoundingClientRect().top < innerHeight * 0.6));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // active nav link
  const links = $$(".nav-links a");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
}

/* ── go ────────────────────────────────────────────────────────── */
(async function init() {
  field($("#field"));
  let p;
  try {
    p = await loadProfile();
  } catch (e) {
    console.error(e);
    $("#boot").classList.add("off");
    $("#hero-summary").textContent = "Couldn't load profile data. Please refresh.";
    return;
  }
  const bootDone = boot(p);
  hero(p); stats(p); about(p); projects(p); experience(p); skills(p); activity(p); contact(p); pipeline(p);
  terminal(p);
  const c = chat();
  palette(p, { copyEmail: copyEmail(p), openChat: c.open });
  $("#copy-email").addEventListener("click", copyEmail(p));
  interactions();
  await bootDone;
  decode($("#hero-name"), p.basics.name);
  revealAll();
})();
