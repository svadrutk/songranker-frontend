import type { JSX, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReceiptMarquee } from "@/components/ReceiptMarquee";

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
    <div className="flex flex-col items-center justify-center h-full w-full gap-8 relative overflow-hidden">
      <ReceiptMarquee />
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center z-10">
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
