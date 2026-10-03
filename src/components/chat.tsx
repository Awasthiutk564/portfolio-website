// Booglu chat widget -> POST /api/chat (Gemini on the server, with a local
// fallback). The server builds Booglu's knowledge from the same profile.json.
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

type Msg = { id: number; who: "me" | "bot"; text: string; typing?: boolean };

const QUICK = ["Who is Utkarsh?", "What's he building now?", "Top projects?", "Is he open to internships?"];
const GREETING = "Hey! 👋 I'm Booglu, Utkarsh's AI assistant. I'm synced with his latest résumé, LinkedIn and GitHub. Ask me anything.";

function readSid() {
  try {
    return sessionStorage.getItem("booglu-sid");
  } catch {
    return null;
  }
}

export function Chat({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const sid = useRef<string | null>(readSid());
  const nextId = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const greetId = nextId.current++;
    setMsgs((m) => (m.length ? m : [{ id: greetId, who: "bot", text: GREETING }]));
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fab.current?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [msgs]);

  async function send(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const meId = nextId.current++, typingId = nextId.current++;
    setMsgs((m) => [...m, { id: meId, who: "me", text: t }, { id: typingId, who: "bot", text: "Booglu is typing…", typing: true }]);
    let reply: string;
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t, sessionId: sid.current }),
      });
      const data = await r.json();
      if (data.sessionId) {
        sid.current = data.sessionId;
        try {
          sessionStorage.setItem("booglu-sid", data.sessionId);
        } catch {}
      }
      reply = data.reply || data.error || "Hmm, I lost my train of thought. Try again?";
    } catch {
      reply = "I can't reach my brain right now. Email Utkarsh directly from the contact section!";
    }
    setMsgs((m) => m.map((x) => (x.id === typingId ? { ...x, text: reply, typing: false } : x)));
  }

  return (
    <>
      <button
        ref={fab}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Chat with Booglu, Utkarsh's AI assistant"
        aria-expanded={open}
        className="group fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary py-1 pl-1 pr-1 text-sm font-medium text-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] transition-all hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 sm:pr-5 md:bottom-6 md:right-6"
      >
        <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black">
          <img src="/images/booglu-avatar.png" alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
        </span>
        <span className="hidden sm:inline">Ask Booglu</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Booglu chat"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed bottom-20 right-4 z-50 flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] md:bottom-24 md:right-6"
          >
            <header className="flex items-center gap-3 border-b border-border p-4">
              <img src="/images/booglu-avatar.png" alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-medium tracking-[-0.02em]">Booglu</p>
                <p className="truncate text-xs text-primary/50">Utkarsh's AI assistant · knows his latest résumé</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={log} aria-live="polite" className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                    m.who === "me" ? "ml-auto rounded-br-md bg-primary text-black" : "rounded-bl-md bg-primary/[0.08] text-primary/90",
                    m.typing && "animate-pulse text-primary/50",
                  )}
                  style={{ lineHeight: 1.4 }}
                >
                  {m.text}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-primary/70 transition-colors hover:bg-primary hover:text-black">
                  {q}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t border-border p-3"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
                setText("");
              }}
            >
              <input
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about Utkarsh…"
                aria-label="Message Booglu"
                maxLength={500}
                className="min-w-0 flex-1 rounded-full bg-primary/[0.06] px-4 py-2.5 text-sm outline-none placeholder:text-primary/35 focus:bg-primary/10"
              />
              <button type="submit" aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black transition-transform hover:scale-105">
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
