import type { JSX } from "react";
import { Trophy } from "lucide-react";
import { SpeedLines } from "./SpeedLines";
import { StatBadge } from "./StatBadge";

type HeaderSectionProps = Readonly<{
  totalDuels: number;
  songCount: number;
}>;

export function HeaderSection({ totalDuels, songCount }: HeaderSectionProps): JSX.Element {
  return (
    <div className="text-center space-y-1 md:space-y-3 relative shrink-0">
      <div className="hidden md:flex items-center justify-center gap-3 mb-0 md:mb-1">
        <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
        <p className="text-[10px] md:text-[11px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono">
          {totalDuels === 0 ? "Initial Encounter" : `Duel #${totalDuels + 1}`}
        </p>
        <div className="h-[1px] md:h-[2px] w-6 md:w-12 bg-primary/20 rounded-full" />
      </div>

      <div className="relative inline-block mb-0.5 md:mb-0">
        <SpeedLines side="left" />
        <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase px-4 leading-none">
          Make Your Choice
        </h2>
        <h2 className="sr-only">Make Your Choice</h2>
        <SpeedLines side="right" />
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs lg:text-sm font-mono text-muted-foreground/60 uppercase font-bold">
        <StatBadge 
          icon={<div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary animate-pulse" />} 
          label={`${songCount} Tracks`} 
        />
        <StatBadge 
          icon={<Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary/60" />} 
          label={`${totalDuels} Duels`} 
        />
      </div>
    </div>
  );
}
