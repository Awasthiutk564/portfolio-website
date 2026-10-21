// Booglu, Utkarsh's AI assistant -> POST /api/chat (Gemini on the server, with
// a local fallback). The server builds Booglu's knowledge from the same
// profile.json. Asking opens the thinking orb: the pill flies up into a dotted
// orb while Booglu thinks, condenses, and unfolds into the answer.
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import { EASE } from "@/components/motion";
import { lockScroll } from "@/lib/smooth-scroll";

// the orb is only fetched when someone heads for the button
const loadOrb = () => import("@/components/ui/ai-thiking-orb-and-input");
const MorphOrb = lazy(loadOrb);

const QUICK = ["Who is Utkarsh?", "What's he building now?", "Top projects?", "Is he open to internships?"];

function readSid() {
  try {
    return sessionStorage.getItem("booglu-sid");
  } catch {
    return null;
  }
}

export function Chat({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const sid = useRef<string | null>(readSid());
  const fab = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // the page stays put behind the assistant; focus goes back to the button after
  useEffect(() => {
    if (open) lockScroll(true);
    else if (wasOpen.current) {
      lockScroll(false);
      fab.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);
  useEffect(() => () => lockScroll(false), []);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const ask = useCallback(async (message: string) => {
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sid.current }),
      });
      const data = await r.json();
      if (data.sessionId) {
        sid.current = data.sessionId;
        try {
          sessionStorage.setItem("booglu-sid", data.sessionId);
        } catch {}
      }
      return data.reply || data.error || "Hmm, I lost my train of thought. Try again?";
    } catch {
      return "I can't reach my brain right now. Email Utkarsh directly from the contact section!";
    }
  }, []);

  return (
    <>
      <button
        ref={fab}
        type="button"
        onClick={() => setOpen(!open)}
        onPointerEnter={loadOrb}
        onFocus={loadOrb}
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
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Booglu, Utkarsh's AI assistant"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-0 z-[60] backdrop-blur-md"
          >
            <Suspense fallback={null}>
            <MorphOrb
              onSubmit={ask}
              onClose={close}
              minThinkMs={1400}
              suggestions={QUICK}
              placeholder="Ask Booglu about Utkarsh…"
              answerTitle="Booglu"
              reset="Ask another"
              intro={
                <div className="flex flex-col items-center gap-4">
                  <img src="/images/booglu-avatar.png" alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-primary/20" />
                  <div>
                    <p className="text-3xl font-medium tracking-[-0.04em] md:text-4xl">
                      Hi, I'm Booglu. <span className="font-serif font-normal italic">Ask away.</span>
                    </p>
                    <p className="mt-2 text-sm text-primary/55">Utkarsh's AI assistant, synced with his résumé, LinkedIn and GitHub.</p>
                  </div>
                </div>
              }
            />
            </Suspense>
            <button
              type="button"
              onClick={close}
              aria-label="Close Booglu"
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary/70 transition-colors hover:bg-primary hover:text-black md:right-6 md:top-6"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
