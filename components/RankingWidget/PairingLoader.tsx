import type { JSX } from "react";

export function PairingLoader(): JSX.Element {
  return (
    <div className="h-[28rem] w-full max-w-4xl flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-primary/[0.01]">
      <div className="h-16 w-16 rounded-full border-4 border-t-primary border-primary/10 animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-[12px] font-mono uppercase tracking-[0.4em] text-primary/60 font-black">
          Optimizing Pairing Matrix
        </p>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40">
          Selecting the most impactful encounter
        </p>
      </div>
    </div>
  );
}
