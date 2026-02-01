import type { JSX, ReactNode } from "react";

type StatBadgeProps = Readonly<{
  icon: ReactNode;
  label: string;
}>;

export function StatBadge({ icon, label }: StatBadgeProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1 md:py-1.5 rounded-full border border-border/40 bg-muted/10 backdrop-blur-sm shadow-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}
