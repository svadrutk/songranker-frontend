"use client";

import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, Check, Crosshair, ListOrdered, Trophy } from "lucide-react";

type ProgressSectionProps = Readonly<{
  displayScore: number;
  totalDuels: number;
  idcCount?: number;
  tieCount?: number;
  songCount: number;
  onViewResults: () => void;
  onPeekRankings: () => void;
}>;

type Phase = {
  id: number;
  name: string;
  completedName: string;
  description: string;
  // Phase thresholds as percentage of recommended duels (0-100)
  startPercent: number;
  endPercent: number;
  icon: JSX.Element;
};

const PHASES: Phase[] = [
  { 
    id: 1, 
    name: "Calibrate", 
    completedName: "Calibrated",
    description: "Initial comparisons",
    startPercent: 0,
    endPercent: 33,
    icon: <Crosshair className="h-3 w-3 md:h-3.5 md:w-3.5" /> 
  },
  { 
    id: 2, 
    name: "Establish", 
    completedName: "Established",
    description: "Building order",
    startPercent: 33,
    endPercent: 66,
    icon: <ListOrdered className="h-3 w-3 md:h-3.5 md:w-3.5" /> 
  },
  { 
    id: 3, 
    name: "Stabilize", 
    completedName: "Stabilized",
    description: "Locking top 10",
    startPercent: 66,
    endPercent: 100,
    icon: <Trophy className="h-3 w-3 md:h-3.5 md:w-3.5" /> 
  },
];

function estimateDuelsForConvergence(nSongs: number, idcCount: number = 0, tieCount: number = 0): { minimum: number; recommended: number } {
  if (nSongs < 2) return { minimum: 0, recommended: 0 };

  // n * ln(n) is a standard theoretical bound for ranking stability.
  // We use natural log (Math.log) for a smoother estimation curve.
  const lnN = Math.log(nSongs);
  
  // Base coefficients optimized for Bradley-Terry convergence with active pairing.
  const minBase = nSongs * lnN * 0.8 + 10;
  const recBase = nSongs * lnN * 1.2 + 20;

  // IDC and Ties increase the total duels needed because they provide less 
  // directional information than clear wins, requiring more duels to reach stability.
  const penalty = idcCount + (tieCount * 0.5);
  
  return {
    minimum: Math.ceil(minBase + penalty),
    recommended: Math.ceil(recBase + penalty),
  };
}

export function ProgressSection({
  displayScore,
  totalDuels,
  idcCount = 0,
  tieCount = 0,
  songCount,
  onViewResults,
  onPeekRankings,
}: ProgressSectionProps): JSX.Element {
  const { minimum, recommended } = estimateDuelsForConvergence(songCount, idcCount, tieCount);
  
  // Calculate progress as percentage of recommended duels
  const duelProgress = Math.min(100, (totalDuels / recommended) * 100);
  
  // Use convergence score as a percentage (0-90 maps to 0-100 for progress purposes)
  const convergenceProgress = Math.min(100, (displayScore / 90) * 100);
  
  // Use the MAX of duel progress or convergence progress - if algorithm converges faster, UI reflects it
  const effectiveProgress = Math.max(duelProgress, convergenceProgress);
  
  // Determine current phase based on effective progress
  const getCurrentPhase = (): number => {
    if (displayScore >= 90) return 4; // Complete (convergence achieved)
    if (effectiveProgress >= 66) return 3;
    if (effectiveProgress >= 33) return 2;
    return 1;
  };
  
  const currentPhase = getCurrentPhase();
  
  // Session is complete only if BOTH convergence is high AND minimum duels are done
  // This prevents premature completion from lucky early convergence
  const hasMinimumDuels = totalDuels >= minimum;
  const isComplete = displayScore >= 90 && hasMinimumDuels;
  
  // Show "almost there" state when converged but below minimum duels
  const isConvergedButNotReady = displayScore >= 90 && !hasMinimumDuels;

  return (
    <div className="w-full max-w-xl space-y-3 md:space-y-4 px-4 shrink-0 relative">
      {/* Estimated duels header */}
      <div className="text-center">
        <p className="text-[9px] md:text-[11px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          {isComplete ? (
            "Rankings Converged"
          ) : (
            <>
            Est. <span className="text-emerald-500/70 font-bold">{minimum}–{recommended}</span> duels for stable rankings
            </>
          )}
        </p>
      </div>

      {/* Phase indicators */}
      <div className="flex items-stretch gap-2 md:gap-3">
        {PHASES.map((phase) => {
          const isCompleted = currentPhase > phase.id || (isComplete && phase.id <= 3);
          const isActive = currentPhase === phase.id && !isComplete;
          const isPending = currentPhase < phase.id && !isComplete;
          
          // Calculate progress within this phase based on effective progress (max of duels or convergence)
          let phaseProgress = 0;
          if (isCompleted) {
            phaseProgress = 100;
          } else if (isActive) {
            const phaseRange = phase.endPercent - phase.startPercent;
            const progressInPhase = effectiveProgress - phase.startPercent;
            phaseProgress = Math.min(100, Math.max(0, (progressInPhase / phaseRange) * 100));
          }

          return (
            <div key={phase.id} className="flex-1 flex flex-col gap-1.5 md:gap-2">
              {/* Phase header */}
              <div className={cn(
                "flex items-center justify-center gap-1.5 md:gap-2 transition-colors duration-300",
                isCompleted && "text-emerald-500",
                isActive && "text-emerald-500",
                isPending && "text-muted-foreground/30"
              )}>
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full border transition-all duration-300",
                  isCompleted && "bg-emerald-500/10 border-emerald-500/50",
                  isActive && "bg-emerald-500/10 border-emerald-500/50",
                  isPending && "bg-muted/5 border-muted-foreground/20"
                )}>
                  {isCompleted ? (
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  ) : (
                    phase.icon
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    "text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-wider truncate",
                    isCompleted && "text-emerald-500",
                    isActive && "text-emerald-500",
                    isPending && "text-muted-foreground/40"
                  )}>
                    {isCompleted ? phase.completedName : phase.name}
                  </span>
                </div>
              </div>

              {/* Phase progress bar */}
              <div className={cn(
                "h-1.5 md:h-2 w-full overflow-hidden rounded-full transition-colors duration-300",
                isCompleted && "bg-emerald-500/20",
                isActive && "bg-emerald-500/20",
                isPending && "bg-muted/10"
              )}>
                <motion.div 
                  className={cn(
                    "h-full rounded-full transition-colors duration-500",
                    isCompleted && "bg-emerald-500",
                    isActive && "bg-emerald-500",
                    isPending && "bg-muted-foreground/20"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${phaseProgress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {(isComplete || isConvergedButNotReady || totalDuels >= 15) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center pt-2 md:pt-3"
          >
            {isComplete ? (
              <Button 
                onClick={onViewResults}
                className="h-12 md:h-14 w-full md:w-[60%] rounded-xl bg-muted/10 hover:bg-emerald-500/5 text-emerald-500 border border-emerald-500 font-mono hover:cursor-pointer uppercase tracking-[0.15em] md:tracking-[0.25em] text-[10px] md:text-xs font-black transition-all group active:scale-95"
              >
                View Results
              </Button>
            ) : isConvergedButNotReady ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-[9px] md:text-[10px] font-mono text-amber-500/80 uppercase tracking-wider">
                  {minimum - totalDuels} more duels for stable rankings
                </p>
                <Button 
                  onClick={onPeekRankings}
                  variant="outline"
                  className="h-11 md:h-14 w-full md:w-[60%] border-amber-500/30 hover:border-amber-500/50 text-muted-foreground hover:text-amber-500 font-mono uppercase tracking-widest text-[9px] md:text-[10px] font-black py-2 md:py-3 px-3 md:px-6 rounded-xl group bg-background/50 backdrop-blur-sm"
                >
                  <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 md:mr-2 group-hover:scale-110 transition-transform" />
                  Peek Rankings (Not Final)
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onPeekRankings}
                variant="outline"
                className="h-11 md:h-14 w-full md:w-[60%] border-emerald-500/20 hover:border-emerald-500/40 text-muted-foreground hover:text-emerald-500 font-mono uppercase tracking-widest text-[9px] md:text-[10px] font-black py-2 md:py-3 px-3 md:px-6 rounded-xl group bg-background/50 backdrop-blur-sm"
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
