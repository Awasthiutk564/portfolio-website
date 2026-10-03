// One latest post from each network. GitHub is fetched live from the public
// events API on every visit (cached for 10 min); LinkedIn has no read API, so
// it comes from content/latest.json, set by the "Share LinkedIn post" Action.
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal, SECTION_X } from "@/components/motion";
import { LiquidButton } from "@/components/ui/liquid-button";
import { ago, type Profile } from "@/lib/profile";
import latest from "../../../content/latest.json";

type Post = { title: string; body?: string; url: string; date?: string };

const CACHE_KEY = "gh-latest-v1";
const TTL = 10 * 60 * 1000;

interface GhEvent {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    ref?: string | null;
    ref_type?: string;
    head?: string;
    commits?: { message: string }[];
    release?: { name?: string; tag_name?: string; html_url?: string };
    action?: string;
    pull_request?: { title?: string; html_url?: string; merged?: boolean };
  };
}

const short = (repo: string) => repo.split("/")[1] || repo;
const firstLine = (s?: string) => (s || "").split("\n")[0].trim();

async function describe(e: GhEvent): Promise<Post | null> {
  const repo = short(e.repo.name), url = `https://github.com/${e.repo.name}`;
  const p = e.payload;
  switch (e.type) {
    case "PushEvent": {
      let msg = firstLine(p.commits?.[p.commits.length - 1]?.message);
      if (!msg && p.head) {
        // the events API no longer embeds commits; look the head commit up
        const r = await fetch(`https://api.github.com/repos/${e.repo.name}/commits/${p.head}`).catch(() => null);
        if (r?.ok) msg = firstLine((await r.json()).commit?.message);
      }
      return { title: `Pushed to ${repo}`, body: msg, url: p.head ? `${url}/commit/${p.head}` : url, date: e.created_at };
    }
    case "CreateEvent":
      return p.ref_type === "repository" ? { title: `Started a new project: ${repo}`, url, date: e.created_at } : null;
    case "PublicEvent":
      return { title: `Open-sourced ${repo}`, url, date: e.created_at };
    case "ReleaseEvent":
      return { title: `Released ${p.release?.name || p.release?.tag_name} of ${repo}`, url: p.release?.html_url || url, date: e.created_at };
    case "PullRequestEvent":
      return p.action === "closed" && p.pull_request?.merged
        ? { title: `Merged a pull request in ${repo}`, body: p.pull_request.title, url: p.pull_request.html_url || url, date: e.created_at }
        : null;
    default:
      return null;
  }
}

function useGithubLatest(p: Profile): Post | null {
  // build-time fallback: the most recently pushed project
  const fallbackRepo = [...p.projects].filter((x) => x.pushed_at).sort((a, b) => (b.pushed_at! > a.pushed_at! ? 1 : -1))[0];
  const fallback: Post | null = fallbackRepo
    ? { title: `Working on ${fallbackRepo.title}`, body: fallbackRepo.tagline || fallbackRepo.description, url: fallbackRepo.url, date: fallbackRepo.pushed_at }
    : null;
  const [post, setPost] = useState<Post | null>(fallback);

  useEffect(() => {
    let alive = true;
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && Date.now() - c.at < TTL) { setPost(c.post); return; }
    } catch {}

    const login = p.github?.user?.url?.split("/").pop() || "Awasthiutk564";
    // repos that aren't "posts": the profile README and this site itself
    const skip = new Set([`${login}/${login}`, `${login}/portfolio-website`]);
    (async () => {
      const r = await fetch(`https://api.github.com/users/${login}/events/public?per_page=40`);
      if (!r.ok) return;
      const events: GhEvent[] = (await r.json()).filter((e: GhEvent) => !skip.has(e.repo.name));
      events.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      for (const e of events) {
        const d = await describe(e);
        if (d) {
          if (alive) setPost(d);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), post: d })); } catch {}
          return;
        }
      }
    })().catch(() => {});
    return () => { alive = false; };
  }, [p]);

  return post;
}

function Card({ network, post, empty }: { network: string; post: Post | null; empty: { text: string; url: string } }) {
  return (
    <article className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-border bg-card p-6 md:rounded-[2rem] md:p-8">
      <div>
        <p className="flex items-center justify-between text-sm text-primary/50">
          <span>Latest on {network}</span>
          {post?.date && <span>{ago(post.date)}</span>}
        </p>
        <h3 className="mt-4 text-2xl font-medium leading-[1] tracking-[-0.04em] md:text-3xl">{post?.title || empty.text}</h3>
        {post?.body && <p className="mt-3 line-clamp-3 font-serif text-xl italic text-primary/75">“{post.body}”</p>}
      </div>
      <LiquidButton href={post?.url || empty.url} target="_blank" rel="noopener" size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />} className="self-start">
        View on {network}
      </LiquidButton>
    </article>
  );
}

export function Latest({ p }: { p: Profile }) {
  const gh = useGithubLatest(p);
  const li = latest.linkedin;
  const linkedinProfile = p.basics.profiles.find((x) => x.network === "LinkedIn")?.url || "https://www.linkedin.com/";
  const githubProfile = p.github?.user?.url || "https://github.com/Awasthiutk564";
  const liPost: Post | null = li.url ? { title: "Posted on LinkedIn", body: li.text || undefined, url: li.url, date: li.date || undefined } : null;

  return (
    <section id="latest" aria-label="Latest posts" className={`${SECTION_X} pt-24 md:pt-36`}>
      <Reveal>
        <p className="mb-6 text-sm text-primary/50">(Now) Fresh off the feed</p>
      </Reveal>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <Reveal>
          <Card network="GitHub" post={gh} empty={{ text: "See what I'm building", url: githubProfile }} />
        </Reveal>
        <Reveal delay={0.08}>
          <Card network="LinkedIn" post={liPost} empty={{ text: "Follow along on LinkedIn", url: linkedinProfile }} />
        </Reveal>
      </div>
    </section>
  );
}
