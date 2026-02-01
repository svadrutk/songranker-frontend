"use client";

import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sword, Eye } from "lucide-react";

type ProgressSectionProps = Readonly<{
  displayScore: number;
  showProgressHint: boolean;
  totalDuels: number;
  onViewResults: () => void;
  onPeekRankings: () => void;
}>;

function getConvergenceLabel(score: number): string {
  if (score < 30) return "Calibrating Rankings...";
  if (score < 60) return "Establishing Order...";
  if (score < 90) return "Stabilizing Top 10...";
  return "Top 10 Stable!";
}

function getProgressColor(score: number): string {
  if (score < 40) return "bg-red-500";
  if (score < 70) return "bg-yellow-500";
  return "bg-green-500";
}

export function ProgressSection({
  displayScore,
  showProgressHint,
  totalDuels,
  onViewResults,
  onPeekRankings,
}: ProgressSectionProps): JSX.Element {
  return (
    <div className="w-full max-w-xl space-y-1 md:space-y-2 px-4 shrink-0 relative">
      <div className="flex items-center justify-between px-1">
        <p className="text-[7px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary/60">
          {getConvergenceLabel(displayScore)}
        </p>
        <p className="text-[7px] md:text-[10px] font-mono font-bold text-muted-foreground/40">
          {Math.round(displayScore)}%
        </p>
      </div>
      <div className="h-1.5 md:h-2 lg:h-3 w-full bg-primary/10 overflow-hidden">
        <motion.div 
          className={cn("h-full transition-colors duration-700", getProgressColor(displayScore))}
          initial={{ width: 0 }}
          animate={{ width: `${displayScore}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence>
        {showProgressHint && displayScore === 40 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center justify-center gap-1.5 md:gap-2 pt-0.5 md:pt-1"
          >
            <Sword className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/50 animate-pulse" />
            <p className="text-[8px] md:text-[10px] font-mono text-muted-foreground/70">
              Keep battling! A few more duels will refine your rankings...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(displayScore >= 90 || totalDuels >= 15) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center pt-6 md:pt-4"
          >
            {displayScore >= 90 ? (
              <Button 
                onClick={onViewResults}
                className="h-12 md:h-14 w-full rounded-xl bg-muted/10 hover:bg-primary/5 text-green-500 border border-green-500 font-mono hover:cursor-pointer uppercase tracking-[0.15em] md:tracking-[0.25em] text-[10px] md:text-xs font-black transition-all group active:scale-95"
              >
                View Results
              </Button>
            ) : (
              <Button 
                onClick={onPeekRankings}
                variant="outline"
                className="h-11 md:h-14 w-full border-primary/20 hover:border-primary/40 text-muted-foreground hover:text-primary font-mono uppercase tracking-widest text-[9px] md:text-[10px] font-black py-2 md:py-3 px-3 md:px-6 rounded-xl group bg-background/50 backdrop-blur-sm"
              >
                <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 md:mr-2 group-hover:scale-110 transition-transform" />
                Peek Rankings
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
