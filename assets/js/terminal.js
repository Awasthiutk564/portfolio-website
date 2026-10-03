// A tiny shell over profile.json. Everything it prints comes from the same
// synced data as the rest of the page.

import { $, esc, ym } from "./util.js";

export function terminal(p) {
  const body = $("#term-body"), out = $("#term-out"), form = $("#term-form"), input = $("#term-input");
  const b = p.basics, gh = p.github?.totals || {};
  const history = [];
  let hi = 0;

  const link = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || url)}</a>`;
  const pad = (s, n) => String(s).padEnd(n);

  const FILES = { "about.txt": () => esc(b.summary), "contact.txt": () => cmds.contact(), "resume.pdf": () => cmds.resume() };

  const cmds = {
    help: () => [
      "available commands:",
      "  whoami        who is this guy",
      "  about         the short version",
      "  projects      what I've built        open <n>  open project n",
      "  experience    roles & internships",
      "  education     where I study",
      "  skills        the stack",
      "  certs         certifications",
      "  github        live GitHub stats",
      "  contact       how to reach me",
      "  resume        open my résumé",
      "  neofetch      system info",
      "  ls · cat <file> · echo · date · history · clear",
    ].join("\n"),
    whoami: () => `${esc(b.name)}\n${esc(b.label)}`,
    about: () => esc(b.summary),
    projects: () => p.projects.slice(0, 12).map((x, i) =>
      `${pad(`[${i + 1}]`, 5)}<span class="c-accent">${esc(pad(x.title, 26))}</span>${esc((x.tagline || x.description || "").slice(0, 90))}`).join("\n")
      + "\n\ntype <span class=\"c-accent\">open 1</span> to open a project",
    open: (n) => {
      const x = p.projects[(+n || 0) - 1];
      if (!x) return `<span class="err">usage: open &lt;number&gt;  (see 'projects')</span>`;
      window.open(x.url, "_blank", "noopener");
      return `opening ${link(x.url, x.title)} …`;
    },
    experience: () => p.experience.map((e) =>
      `<span class="c-accent">${esc(e.title)}</span> @ ${esc(e.company)}\n  ${esc(ym(e.start))} — ${e.end ? esc(ym(e.end)) : "present"}${e.location ? " · " + esc(e.location) : ""}\n  ${esc(e.summary || "")}`).join("\n\n"),
    education: () => p.education.map((e) =>
      `<span class="c-accent">${esc(e.institution)}</span>\n  ${esc([e.degree, e.area].filter(Boolean).join(", "))}${e.start ? `  (${esc(ym(e.start))} — ${esc(ym(e.end))})` : ""}`).join("\n"),
    skills: () => p.skills.map((s) => `${pad(s.category, 14)}${s.items.join(" · ")}`).map(esc).join("\n"),
    certs: () => p.certifications.map((c) => `✓ ${esc(c.name)}${c.issuer ? ` <span class="c-muted">(${esc(c.issuer)})</span>` : ""}`).join("\n"),
    github: () => `repos         ${gh.repos ?? "?"}\nstars         ${gh.stars ?? "?"}\ncontributions ${gh.contributions ?? "?"} in the last year\nlongest streak ${gh.longest_streak ?? "?"} days\n${link(p.github?.user?.url || "https://github.com/Awasthiutk564")}`,
    contact: () => [`email     <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`,
      ...(b.profiles || []).map((x) => `${pad(x.network.toLowerCase(), 10)}${link(x.url)}`)].join("\n"),
    resume: () => {
      if (!p._meta?.resume_pdf) return "résumé PDF coming soon. Try 'experience' meanwhile.";
      window.open("/resume.pdf", "_blank", "noopener");
      return "opening resume.pdf …";
    },
    neofetch: () => {
      const logo = ["   ▄▄▄▄▄▄   ", "  █ ▄▄ ▄▄ █  ", "  █  UA   █  ", "  █▄▄▄▄▄▄▄█  ", "   ▀▀▀▀▀▀▀   ", "", "", ""];
      const info = [
        `<span class="c-accent">${esc(b.handle || "utkarsh")}</span>@<span class="c-accent">portfolio</span>`,
        "-----------------",
        `<span class="c-violet">OS</span>: utkarsh-os (ECE edition)`,
        `<span class="c-violet">Role</span>: ${esc(b.label)}`,
        `<span class="c-violet">Uptime</span>: since ${esc(ym(p.education?.[0]?.start) || "2024")}`,
        `<span class="c-violet">Shell</span>: zsh + python + c`,
        `<span class="c-violet">Repos</span>: ${gh.repos ?? "?"}  <span class="c-violet">Stars</span>: ${gh.stars ?? "?"}`,
        `<span class="c-violet">Status</span>: ${esc(b.availability || "building")}`,
      ];
      return info.map((l, i) => `<span class="c-accent">${esc(logo[i] || "")}</span>  ${l}`).join("\n");
    },
    ls: () => Object.keys(FILES).join("  ") + "  projects/  experience/",
    cat: (f) => FILES[f] ? FILES[f]() : `<span class="err">cat: ${esc(f || "")}: no such file</span>`,
    echo: (...a) => esc(a.join(" ")),
    date: () => new Date().toString(),
    history: () => history.map((h, i) => `${pad(i + 1, 4)}${esc(h)}`).join("\n"),
    clear: () => { out.innerHTML = ""; return null; },
    sudo: (...a) => {
      if (!/hire/.test(a.join(" "))) return `<span class="err">nice try. maybe 'sudo hire-me'?</span>`;
      setTimeout(() => (location.href = `mailto:${b.email}?subject=${encodeURIComponent("Let's talk")}`), 900);
      return `[sudo] password for recruiter: ********\n<span class="c-accent">✓ access granted.</span> Great choice. Opening a draft email…`;
    },
    "hire-me": () => cmds.sudo("hire"),
    exit: () => "there is no escape. (try 'contact')",
  };

  function print(html, cls = "") {
    if (html == null) return;
    const pre = document.createElement("pre");
    if (cls) pre.className = cls;
    pre.innerHTML = html;
    out.appendChild(pre);
    body.scrollTop = body.scrollHeight;
  }

  function run(line) {
    const raw = line.trim();
    print(`<span class="c-accent">utkarsh@portfolio</span>:<span class="c-violet">~</span>$ <span class="cmd">${esc(raw)}</span>`);
    if (!raw) return;
    history.push(raw); hi = history.length;
    const [name, ...args] = raw.split(/\s+/);
    const fn = cmds[name.toLowerCase()];
    print(fn ? fn(...args) : `<span class="err">command not found: ${esc(name)}</span>. type 'help'`);
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ""; }
    else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(cmds).filter((c) => c.startsWith(input.value.trim()));
      if (m.length === 1) input.value = m[0] + " ";
      else if (m.length) print(m.join("  "));
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); cmds.clear(); }
  });
  body.addEventListener("click", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

  print(`utkarsh-os 1.0 · data synced ${esc((p._meta?.built_at || "").slice(0, 10))}\ntype <span class="c-accent">help</span> to see what I can do.\n`);
  return { run };
}
