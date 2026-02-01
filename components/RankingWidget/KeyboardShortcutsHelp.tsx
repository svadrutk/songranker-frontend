import type { JSX } from "react";

const SHORTCUTS = [
  { label: "Select Left", key: "←" },
  { label: "Select Right", key: "→" },
  { label: "Tie", key: "↑" },
  { label: "IDC", key: "↓" },
] as const;

export function KeyboardShortcutsHelp(): JSX.Element {
  return (
    <div className="hidden md:flex flex-col gap-1.5 fixed top-24 right-8 z-40 opacity-40 hover:opacity-100 transition-opacity p-4 rounded-xl bg-background/5 backdrop-blur-sm border border-primary/5">
      {SHORTCUTS.map(({ label, key }) => (
        <div key={label} className="flex items-center justify-end gap-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-medium">
            {label}
          </span>
          <kbd className="h-6 min-w-[24px] px-1.5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground font-mono text-[10px] font-bold shadow-sm">
            {key}
          </kbd>
        </div>
      ))}
    </div>
  );
}
