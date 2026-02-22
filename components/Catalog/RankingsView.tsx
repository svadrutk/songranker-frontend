"use client";

import { useState, type JSX } from "react";
import { History, Loader2, Layers, Calendar, CheckCircle2, BarChart2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/lib/api";

type RankingsViewProps = Readonly<{
  sessions: SessionSummary[];
  loading: boolean;
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
}>;

export function RankingsView({
  sessions,
  loading,
  activeSessionId,
  onSelect,
}: RankingsViewProps): JSX.Element {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
        <History className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs font-mono text-muted-foreground">No completed rankings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <button
          key={session.session_id}
          type="button"
          onClick={() => onSelect(session.session_id)}
          className={cn(
            "w-full group flex items-center gap-3 pt-3 px-3 pb-4 rounded-md border transition-all text-left",
            activeSessionId === session.session_id
              ? "border-primary/40 bg-primary/5 shadow-xs"
              : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
          )}
        >
          <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-muted/20">
            {(session.top_album_covers ?? []).length > 0 && !imageErrors[session.session_id] ? (
              <Image
                src={(session.top_album_covers ?? [])[0]}
                alt=""
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageErrors((prev) => ({ ...prev, [session.session_id]: true }))}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Layers className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className={cn(
              "font-mono text-xs font-bold truncate block",
              activeSessionId === session.session_id ? "text-primary" : ""
            )}>
              {session.display_name || session.primary_artist}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 opacity-50" />
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(session.created_at))}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 opacity-50" />
                {session.convergence_score ?? 0}%
              </span>
            </div>
          </div>
          <BarChart2 className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
        </button>
      ))}
    </div>
  );
}
