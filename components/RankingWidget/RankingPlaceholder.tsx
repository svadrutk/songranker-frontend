import type { JSX, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RankingPlaceholderProps = Readonly<{
  title: string;
  description: string;
  icon?: ReactNode;
  buttonText?: string;
  onClick?: () => void;
  hideButton?: boolean;
}>;

export function RankingPlaceholder({
  title,
  description,
  icon,
  buttonText,
  onClick,
  hideButton = false,
}: RankingPlaceholderProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
        <div className="relative flex items-center justify-center gap-4 md:gap-8 opacity-50 hover:opacity-60 dark:opacity-25 dark:hover:opacity-40 dark:grayscale pointer-events-none select-none transform transition-all duration-700 hover:scale-105">
          <div className="absolute inset-0 bg-[#82A67D]/30 dark:bg-primary/20 blur-[60px] md:blur-[100px] rounded-full z-[-1]" />
          <div className="hidden md:block h-48 w-32 lg:h-64 lg:w-48 rounded-2xl border-2 border-dashed border-[#82A67D]/60 dark:border-primary/40 bg-linear-to-b from-[#82A67D]/15 dark:from-primary/5 to-transparent" />
          <div className="flex flex-col gap-4 md:gap-6 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#82A67D]/40 dark:bg-primary/20 -z-10 hidden md:block" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#82A67D]/40 dark:bg-primary/20 -z-10 md:hidden" />
            <div className="h-24 w-32 md:h-28 md:w-44 rounded-xl border-2 border-dashed border-[#82A67D]/70 dark:border-primary/60 bg-[#82A67D]/20 dark:bg-background/50 backdrop-blur-xs flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-[#82A67D]/40 dark:bg-primary/10" />
            </div>
            <div className="h-24 w-32 md:h-28 md:w-44 rounded-xl border-2 border-dashed border-[#82A67D]/70 dark:border-primary/60 bg-[#82A67D]/20 dark:bg-background/50 backdrop-blur-xs flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-[#82A67D]/40 dark:bg-primary/10" />
            </div>
          </div>
          <div className="hidden md:block h-48 w-32 lg:h-64 lg:w-48 rounded-2xl border-2 border-dashed border-[#82A67D]/60 dark:border-primary/40 bg-linear-to-b from-[#82A67D]/15 dark:from-primary/5 to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-sm">{description}</p>
          </div>
          {!hideButton && (
            <Button
              onClick={onClick}
              className={cn(
                "border-2 border-primary bg-transparent hover:bg-primary/10 hover:scale-105 transition-all duration-300 group",
                buttonText ? "h-auto py-4 px-8 rounded-full" : "h-16 w-16 rounded-full"
              )}
            >
              {icon}
              {buttonText && <span className="ml-2">{buttonText}</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
