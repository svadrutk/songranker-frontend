import type { JSX } from "react";
import { BarChart2 } from "lucide-react";

export function AnalyticsPlaceholder(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full opacity-80 py-20 animate-in fade-in duration-300">
      <BarChart2 className="h-10 w-10 mb-4 text-primary" />
      <p className="text-xs font-mono text-center px-4 text-muted-foreground">
        Analytics open on the right →
      </p>
      <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">
        Global &amp; user stats
      </p>
    </div>
  );
}
