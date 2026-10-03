// data/profile.json is rebuilt by the sync pipeline (see PIPELINE.md) and every
// sync commit triggers a redeploy, so it is bundled at build time.
import raw from "../../data/profile.json";

export interface Project {
  title: string;
  repo?: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  url: string;
  homepage?: string | null;
  language?: string | null;
  stars?: number;
  forks?: number;
  pushed_at?: string;
  featured?: boolean;
}

export interface Profile {
  basics: {
    name: string;
    handle?: string;
    label: string;
    roles: string[];
    summary: string;
    location?: string;
    timezone?: string;
    email: string;
    availability?: string;
    photo?: string;
    profiles: { network: string; username: string; url: string }[];
  };
  focus: { title: string; items: string[] }[];
  now?: { building?: string; improving?: string[] };
  experience: {
    company: string;
    title: string;
    location?: string | null;
    start?: string | null;
    end?: string | null;
    summary?: string;
    highlights?: string[];
    tags?: string[];
  }[];
  education: {
    institution: string;
    degree?: string | null;
    area?: string | null;
    start?: string | null;
    end?: string | null;
  }[];
  certifications: { name: string; issuer?: string; date?: string; url?: string }[];
  skills: { category: string; items: string[] }[];
  projects: Project[];
  github?: {
    user?: { url?: string };
    totals: {
      repos?: number;
      stars?: number;
      forks?: number;
      contributions?: number;
      current_streak?: number;
      longest_streak?: number;
    };
    languages?: Record<string, number>;
    contributions?: { date: string; count: number }[];
  };
  _meta?: {
    built_at?: string;
    sources?: Record<string, string | boolean | null>;
    resume_pdf?: boolean;
  };
}

export const profile = raw as unknown as Profile;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-12" -> "Dec 2025", "2025" -> "2025", null -> "" */
export function ym(v?: string | null) {
  if (!v) return "";
  const [y, m] = String(v).split("-");
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
}

export function ago(iso?: string | null) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units: [number, string][] = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [n, u] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
}

export const initials = (s?: string) =>
  String(s || "").split(/[\s,.&/-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

export const pad2 = (n: number) => String(n).padStart(2, "0");

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
