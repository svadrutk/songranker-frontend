"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ReceiptMarquee } from "./ReceiptMarquee";
import { LogIn, ChevronDown } from "lucide-react";

interface LandingPageProps {
  openAuthModal: (mode?: "login" | "signup") => void;
}

const STEPS = [
  {
    number: "01",
    title: "Find your songs",
    description:
      "Search any artist or paste a public Spotify/Apple Music playlist link to get started.",
    image: "/findSongs.png",
  },
  {
    number: "02",
    title: "Review & clean",
    description:
      "Smart matching catches duplicates, remasters, and live versions.",
    image: "/reviewSelections.png",
  },
  {
    number: "03",
    title: "Duel it out",
    description:
      "Two songs, one choice. Adaptive matchups that converge fast.",
    image: "/duel.png",
  },
  {
    number: "04",
    title: "See your rankings",
    description:
      "A statistically-ranked list you can share, export, or revisit.",
    image: "/leaderboard.png",
  },
];

const FEATURES = [
  {
    title: "Global leaderboards",
    description:
      "See how the world ranks every artist. Contribute your voice to the community consensus.",
    image: "/globalRankings.png",
  },
  {
    title: "Track everything",
    description:
      "Resume unfinished sessions, revisit past rankings, and watch your taste evolve over time.",
    image: "/viewMyRankings.png",
  },
];

export function LandingPage({ openAuthModal }: LandingPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const [scrollHidden, setScrollHidden] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const buttonLogoSrc = mounted && resolvedTheme === "dark" ? "/logo/logo-dark.svg" : "/logo/logo.svg";

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrollHidden(y > 50);
  });

  const scrollPastHero = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const hero = container.querySelector("section");
    if (hero) {
      container.scrollTo({ top: hero.offsetHeight, behavior: "smooth" });
    }
  }, []);

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto scroll-smooth">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-background">
        <ReceiptMarquee />

        <div className="flex flex-col items-center gap-10 sm:gap-12 w-full max-w-2xl text-center px-6 relative z-10">
          <div className="flex flex-col items-center gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-foreground leading-none">
                Find your favorites<span className="text-primary">.</span>
              </h1>
              <p className="text-sm sm:text-sm md:text-base text-muted-foreground font-mono max-w-[280px] sm:max-w-lg mx-auto uppercase tracking-widest leading-relaxed">
                Your music, ranked — one matchup at a time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
              <button
                onClick={() => openAuthModal("signup")}
                className="h-14 sm:h-16 px-10 rounded-full bg-primary text-primary-foreground font-mono font-black uppercase tracking-wider text-base hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <Image src={buttonLogoSrc} alt="" width={26} height={26} className="group-hover:rotate-12 transition-transform duration-300" />
                Join
              </button>
              <button
                onClick={() => openAuthModal("login")}
                className="h-14 sm:h-16 px-10 rounded-full border-2 border-primary/20 bg-background/50 backdrop-blur-md text-foreground font-mono font-black uppercase tracking-wider text-base hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-5 w-5" /> Sign In
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Scroll indicator — fixed to viewport bottom, fades out on scroll */}
      <motion.button
        type="button"
        aria-label="Scroll down"
        onClick={scrollPastHero}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{
          opacity: scrollHidden ? 0 : 1,
          pointerEvents: scrollHidden ? "none" : "auto",
        }}
        transition={{
          opacity: { delay: scrollHidden ? 0 : 0.5, duration: scrollHidden ? 0.3 : 0.4 },
        }}
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Scroll
        </span>
        <ChevronDown className="h-6 w-6 text-muted-foreground" />
      </motion.button>

      {/* ─── How It Works ─── */}
      <section className="py-24 sm:py-32 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">
              The process
            </p>
            <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tighter text-foreground">
              How it works<span className="text-primary">.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-14">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="overflow-hidden ring-1 ring-border shadow-xl mb-5 bg-black">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={1920}
                    height={1080}
                    className="w-full h-auto block"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
                  />
                </div>
                <span className="font-mono text-[11px] tracking-[0.25em] text-primary/70 uppercase">
                  Step {step.number}
                </span>
                <h3 className="font-sans text-xl font-semibold tracking-tight text-foreground mt-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 sm:py-32 px-6 bg-background border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Beyond ranking
            </p>
            <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tighter text-foreground">
              More to explore<span className="text-primary">.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group border border-border/80 bg-card overflow-hidden hover:border-primary/20 transition-colors duration-300"
              >
                <div className="overflow-hidden bg-black">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={1920}
                    height={1080}
                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 sm:py-36 px-6 bg-background border-t border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tighter text-foreground mb-4">
            Ready to rank<span className="text-primary">?</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-mono uppercase tracking-widest leading-relaxed mb-10">
            It takes 30 seconds to start your first session.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => openAuthModal("signup")}
              className="h-16 sm:h-20 px-14 rounded-full bg-primary text-primary-foreground font-mono font-black uppercase tracking-wider text-lg sm:text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Image src={buttonLogoSrc} alt="" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-300" />
              Join
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
