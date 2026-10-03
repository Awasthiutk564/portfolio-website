// A tiny shell over profile.json. Everything it prints comes from the same
// synced data as the rest of the page. Output is built from escaped strings.
import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal, SECTION_X, SectionHead } from "@/components/motion";
import { esc, ym, type Profile } from "@/lib/profile";

type Line = { id: number; html: string };

const link = (url: string, text?: string) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || url)}</a>`;
const pad = (s: unknown, n: number) => String(s).padEnd(n);
const PROMPT = `<span class="c-accent">utkarsh@portfolio</span>:<span class="c-violet">~</span>$`;

function makeCommands(p: Profile, history: string[], clear: () => void) {
  const b = p.basics, gh = p.github?.totals || {};
  const cmds: Record<string, (...a: string[]) => string | null> = {
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
    ls: () => Object.keys(files).join("  ") + "  projects/  experience/",
    cat: (f) => (files[f] ? files[f]() : `<span class="err">cat: ${esc(f || "")}: no such file</span>`),
    echo: (...a) => esc(a.join(" ")),
    date: () => new Date().toString(),
    history: () => history.map((h, i) => `${pad(i + 1, 4)}${esc(h)}`).join("\n"),
    clear: () => { clear(); return null; },
    sudo: (...a) => {
      if (!/hire/.test(a.join(" "))) return `<span class="err">nice try. maybe 'sudo hire-me'?</span>`;
      setTimeout(() => (location.href = `mailto:${b.email}?subject=${encodeURIComponent("Let's talk")}`), 900);
      return `[sudo] password for recruiter: ********\n<span class="c-accent">✓ access granted.</span> Great choice. Opening a draft email…`;
    },
    "hire-me": () => cmds.sudo("hire"),
    exit: () => "there is no escape. (try 'contact')",
  };
  const files: Record<string, () => string | null> = {
    "about.txt": () => esc(b.summary),
    "contact.txt": () => cmds.contact(),
    "resume.pdf": () => cmds.resume(),
  };
  return cmds;
}

export function Terminal({ p }: { p: Profile }) {
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 0, html: `utkarsh-os 1.0 · data synced ${esc((p._meta?.built_at || "").slice(0, 10))}\ntype <span class="c-accent">help</span> to see what I can do.\n` },
  ]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const hi = useRef(0);
  const nextId = useRef(1);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const cmds = useMemo(() => makeCommands(p, history.current, () => setLines([])), [p]);

  const print = (...html: (string | null)[]) => {
    const add = html.filter((h): h is string => h != null).map((h) => ({ id: nextId.current++, html: h }));
    setLines((ls) => [...ls, ...add]);
  };

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  function run(line: string) {
    const raw = line.trim();
    const echo = `${PROMPT} <span class="cmd">${esc(raw)}</span>`;
    if (!raw) return print(echo);
    history.current.push(raw);
    hi.current = history.current.length;
    const [name, ...args] = raw.split(/\s+/);
    const fn = cmds[name.toLowerCase()];
    if (name.toLowerCase() === "clear") return void cmds.clear();
    print(echo, fn ? fn(...args) : `<span class="err">command not found: ${esc(name)}</span>. type 'help'`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const h = history.current;
    if (e.key === "ArrowUp" && h.length) {
      e.preventDefault();
      hi.current = Math.max(0, hi.current - 1);
      setValue(h[hi.current]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hi.current = Math.min(h.length, hi.current + 1);
      setValue(h[hi.current] || "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const m = Object.keys(cmds).filter((c) => c.startsWith(value.trim()));
      if (m.length === 1) setValue(m[0] + " ");
      else if (m.length) print(m.join("  "));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <section id="terminal" className={`${SECTION_X} py-24 md:py-36`}>
      <SectionHead
        index="06"
        label="Shell"
        title="Prefer the command line?"
        sub={<>Type <code className="font-mono text-primary">help</code>. Tab completes, ↑ recalls.</>}
      />
      <Reveal>
        <div className="term overflow-hidden rounded-2xl border border-border bg-card md:rounded-[2rem]">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5 md:px-7">
            <i className="h-2.5 w-2.5 rounded-full bg-primary/25" />
            <i className="h-2.5 w-2.5 rounded-full bg-primary/25" />
            <i className="h-2.5 w-2.5 rounded-full bg-primary/25" />
            <span className="ml-3 truncate font-mono text-xs text-primary/50">utkarsh@portfolio: ~ (zsh)</span>
          </div>
          <div
            ref={body}
            className="h-[420px] overflow-y-auto p-5 font-mono text-[12.5px] leading-relaxed text-primary/80 md:h-[460px] md:p-7 md:text-[13.5px]"
            onClick={() => { if (!getSelection()?.toString()) input.current?.focus({ preventScroll: true }); }}
          >
            {lines.map((l) => (
              <pre key={l.id} dangerouslySetInnerHTML={{ __html: l.html }} />
            ))}
            <form
              className="flex gap-2"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                run(value);
                setValue("");
              }}
            >
              <label htmlFor="term-input" className="shrink-0" dangerouslySetInnerHTML={{ __html: PROMPT }} />
              <input
                id="term-input"
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                aria-label="Terminal input"
                className="min-w-0 flex-1 bg-transparent text-primary caret-primary outline-none"
              />
            </form>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
