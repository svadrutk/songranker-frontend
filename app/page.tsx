"use client";

import { SessionBuilder } from "@/components/SessionBuilder";
import { useAuth } from "@/components/AuthProvider";
import { ReceiptMarquee } from "@/components/ReceiptMarquee";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JSX } from "react";

export default function Home(): JSX.Element {
  const { user, openAuthModal } = useAuth();
  
  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {!user && <ReceiptMarquee />}
      
      {/* Main Content — now always full space */}
      <main
        className="flex-1 min-h-0 h-full overflow-hidden relative"
      >
        {/* Clean Minimalist Background - hidden if marquee is showing */}
        <div className={cn("absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000", user ? "opacity-20" : "opacity-0")}>
          <div className="absolute inset-0 bg-linear-to-br from-background via-background/50 to-primary/5" />
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        {user ? (
          <SessionBuilder />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full gap-8 relative z-10">
            <div className="flex flex-col items-center gap-10 sm:gap-12 w-full max-w-2xl text-center px-6">
              <div className="flex flex-col items-center gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                  <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-foreground leading-none">
                    Find your favorites<span className="text-primary">.</span>
                  </h1>
                  <p className="text-[10px] sm:text-sm md:text-base text-muted-foreground font-mono max-w-[280px] sm:max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                    Search artists, select albums, and start ranking your top tracks.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="h-12 sm:h-14 px-8 rounded-full bg-primary text-primary-foreground font-mono font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20"
                  >
                    Join Chorusboard
                  </button>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="h-12 sm:h-14 px-8 rounded-full border-2 border-primary/20 bg-background/50 backdrop-blur-md text-foreground font-mono font-black uppercase tracking-[0.2em] text-sm hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" /> Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

