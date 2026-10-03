import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PrismaHero, type PrismaNavItem } from "@/components/ui/prisma-hero";
import { LiquidButton, LiquidMetalDefs } from "@/components/ui/liquid-button";
import { Latest } from "@/components/sections/latest";
import { FloatingNav } from "@/components/floating-nav";
import { CommandPalette } from "@/components/command-palette";
import { Chat } from "@/components/chat";
import { EASE } from "@/components/motion";
import { About } from "@/components/sections/about";
import { Stats } from "@/components/sections/stats";
import { Work } from "@/components/sections/work";
import { Experience } from "@/components/sections/experience";
import { Stack } from "@/components/sections/stack";
import { Activity } from "@/components/sections/activity";
import { Terminal } from "@/components/sections/terminal";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { copyText, profile as p } from "@/lib/profile";

const NAV: PrismaNavItem[] = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "Contact", href: "#contact" },
];

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyEmail = useCallback(async () => {
    if (await copyText(p.basics.email)) notify("✓ Email copied to clipboard");
    else location.href = `mailto:${p.basics.email}`;
  }, [notify]);

  const openChat = useCallback(() => setChatOpen(true), []);

  return (
    <MotionConfig reducedMotion="user">
      <LiquidMetalDefs />
      <a
        href="#about"
        className="sr-only z-[70] rounded-full bg-primary px-4 py-2 text-sm text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <FloatingNav items={NAV} onSearch={() => setPaletteOpen(true)} />

      <main>
        <PrismaHero
          className="h-[100svh] p-2 md:p-3"
          title={p.basics.name.split(" ")[0]}
          // "Utkarsh" is a letter longer than "Prisma"; keep it inside its 8 columns
          titleClassName="text-[25vw] sm:text-[24vw] md:text-[22vw] lg:text-[17vw] xl:text-[17.5vw] 2xl:text-[18vw]"
          description={p.basics.summary}
          navItems={NAV}
          cta={
            <LiquidButton href="#work" icon={<ArrowRight className="h-4 w-4" />}>
              View my work
            </LiquidButton>
          }
        />
        <About p={p} />
        <Stats p={p} />
        <Latest p={p} />
        <Work p={p} />
        <Experience p={p} />
        <Stack p={p} />
        <Activity p={p} />
        <Terminal p={p} />
        <Contact p={p} />
      </main>

      <Footer p={p} />

      <Chat open={chatOpen} setOpen={setChatOpen} />
      <CommandPalette p={p} open={paletteOpen} setOpen={setPaletteOpen} copyEmail={copyEmail} openChat={openChat} />

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-black"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
