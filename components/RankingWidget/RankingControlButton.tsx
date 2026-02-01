import type { JSX, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RankingControlButtonProps = Readonly<{
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}>;

export function RankingControlButton({
  icon,
  label,
  onClick,
  disabled,
  isActive,
}: RankingControlButtonProps): JSX.Element {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 md:h-18 w-full md:w-48 rounded-lg md:rounded-2xl transition-all p-0 overflow-hidden",
        "border-[#82A67D]/35 hover:border-[#82A67D]/50 dark:border-border/40 dark:hover:border-primary/50",
        "bg-[#82A67D]/25 hover:bg-[#82A67D]/45 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80",
        "shadow-lg hover:shadow-[#82A67D]/10 dark:hover:shadow-primary/5",
        isActive && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:border-primary shadow-xl shadow-primary/25",
        !isActive && "text-[#5a7557] dark:text-muted-foreground"
      )}
    >
      <div className="flex flex-row items-stretch h-full w-full">
        {icon && (
          <div className={cn(
            "flex items-center justify-center aspect-square h-full shrink-0 transition-colors border-r border-[#82A67D]/30 dark:border-white/5",
            isActive ? "bg-white/20 text-white" : "bg-[#82A67D]/20 text-[#5a7557] dark:bg-white/10 dark:text-muted-foreground group-hover:bg-[#82A67D]/35 group-hover:text-[#5a7557] dark:group-hover:text-primary dark:group-hover:bg-white/20"
          )}>
            {icon}
          </div>
        )}
        <div className="flex items-center justify-center flex-1 px-2 md:px-3">
          <span className="text-[9px] md:text-base font-mono uppercase tracking-[0.15em] md:tracking-[0.25em] font-black">
            {label}
          </span>
        </div>
      </div>
    </Button>
  );
}
