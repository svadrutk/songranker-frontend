import type { JSX } from "react";

export function LoadingSkeleton(): JSX.Element {
  return (
    <div className="w-full space-y-1">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="w-full flex items-center gap-3 p-2 rounded-md border border-transparent bg-card/40 animate-pulse"
        >
          <div className="h-8 w-8 shrink-0 rounded bg-muted" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="h-2.5 w-1/3 rounded bg-muted" />
            <div className="h-2 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
