import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { WordsPullUp } from "@/components/ui/prisma-hero";
import { Reveal } from "@/components/motion";
import { LiquidButton } from "@/components/ui/liquid-button";
import { copyText, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Status = { tone: "idle" | "ok" | "bad"; text: string; mailto?: string };

const field = "w-full border-b border-black/20 bg-transparent py-3 text-base text-black outline-none transition-colors placeholder:text-black/35 focus:border-black md:text-lg";

export function Contact({ p }: { p: Profile }) {
  const b = p.basics;
  const [hint, setHint] = useState("click to copy");
  const [status, setStatus] = useState<Status>({ tone: "idle", text: "" });
  const [sending, setSending] = useState(false);

  async function copy() {
    if (await copyText(b.email)) setHint("✓ copied to clipboard");
    else location.href = `mailto:${b.email}`;
    setTimeout(() => setHint("click to copy"), 2200);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setStatus({ tone: "bad", text: "✗ please fill every field with a valid email" });
      return;
    }
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    // if the server can't deliver, hand the visitor a pre-filled email so their message isn't lost
    const mailto = `mailto:${b.email}?subject=${encodeURIComponent(data.subject || "Hello")}&body=${encodeURIComponent(`${data.message || ""}\n\n— ${data.name || ""}`)}`;
    setSending(true);
    setStatus({ tone: "idle", text: "sending…" });
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || "couldn't send");
      setStatus({ tone: "ok", text: "✓ Message delivered to my inbox. I'll get back to you soon." });
      form.reset();
    } catch (err) {
      setStatus({ tone: "bad", text: `✗ ${(err as Error).message}.`, mailto });
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="p-2 md:p-3">
      <div className="relative overflow-hidden rounded-2xl bg-primary text-black md:rounded-[2rem]">
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply" />

        <div className="relative grid grid-cols-12 gap-x-4 gap-y-14 px-4 pt-16 sm:px-6 md:px-10 md:pt-24">
          <Reveal className="col-span-12 lg:col-span-5">
            <p className="text-sm text-black/55">(07) Contact</p>
            <p className="mt-6 max-w-md text-2xl font-medium leading-[1.05] tracking-[-0.035em] md:text-3xl">
              Internships, collaborations, or just a good problem. <span className="font-serif font-normal italic">My inbox is open.</span>
            </p>

            <button
              type="button"
              onClick={copy}
              className="group mt-10 block text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              <span className="block text-sm text-black/55">email</span>
              <span className="mt-1 block break-all text-2xl font-medium tracking-[-0.04em] underline decoration-black/25 decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-black md:text-[2.2vw]">
                {b.email}
              </span>
              <span className="mt-2 block text-xs text-black/55" aria-live="polite">{hint}</span>
            </button>

            <div className="mt-8 flex flex-wrap gap-2">
              {(b.profiles || []).map((x) => (
                <LiquidButton key={x.url} href={x.url} target="_blank" rel="noopener" tone="obsidian" size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  {x.network}
                </LiquidButton>
              ))}
            </div>
          </Reveal>

          <Reveal className="col-span-12 lg:col-span-6 lg:col-start-7" delay={0.12}>
            <form onSubmit={submit} noValidate className="grid gap-6 sm:grid-cols-2">
              <label className="text-sm text-black/55">
                Name
                <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" className={field} />
              </label>
              <label className="text-sm text-black/55">
                Email
                <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@company.com" className={field} />
              </label>
              <label className="text-sm text-black/55 sm:col-span-2">
                Subject
                <input name="subject" required maxLength={200} placeholder="What's it about?" className={field} />
              </label>
              <label className="text-sm text-black/55 sm:col-span-2">
                Message
                <textarea name="message" rows={4} required maxLength={5000} placeholder="Tell me a little…" className={cn(field, "resize-none")} />
              </label>
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                {/* honeypot: hidden from people, bots fill it and get dropped */}
                <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <LiquidButton type="submit" tone="obsidian" disabled={sending} icon={<ArrowRight className="h-4 w-4" />}>
                  {sending ? "Sending…" : "Send message"}
                </LiquidButton>
                <p role="status" className={cn("text-sm", status.tone === "bad" ? "text-[#9a3412]" : "text-black/65")}>
                  {status.text}
                  {status.mailto && (
                    <>
                      {" "}
                      <a href={status.mailto} className="font-medium text-black underline underline-offset-4">
                        Send it from your email app instead
                      </a>
                    </>
                  )}
                </p>
              </div>
            </form>
          </Reveal>

          <div className="col-span-12 -mb-[0.06em]">
            <h2 className="font-medium leading-[0.85] tracking-[-0.07em] text-[24vw] md:text-[19vw]">
              <WordsPullUp text="Let's talk" showAsterisk />
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
