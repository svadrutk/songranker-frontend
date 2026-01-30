"use client";

import { useEffect, useState, useCallback, type JSX } from "react";
import { Calendar, CheckCircle2, Layers, Loader2, PlayCircle, Swords } from "lucide-react";
import Image from "next/image";
import { getUserSessions, type SessionSummary } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const COMPLETION_THRESHOLD = 25;
/** Same as RankingWidget "View Results" threshold (displayScore >= 90) so completed rankings appear in Completed column. */
const COMPLETED_THRESHOLD = 90;

type MyRankingsOverviewProps = Readonly<{
  isSidebarCollapsed?: boolean;
  onSelectSession: (sessionId: string) => void;
}>;

export function MyRankingsOverview({ isSidebarCollapsed = false, onSelectSession }: MyRankingsOverviewProps): JSX.Element {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(!!user);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserSessions(user.id);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[MyRankingsOverview] Failed to load sessions:", err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-sm font-mono text-muted-foreground">Sign in to see your rankings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading rankings…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-mono font-bold uppercase text-muted-foreground">
            No rankings yet
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono">
            Start a ranking to see it here.
          </p>
        </div>
      </div>
    );
  }

  /** Draft: not started or less than 25% complete. Ordered most complete to least complete. */
  const draftSessions = [...sessions]
    .filter((s) => (s.convergence_score ?? 0) < COMPLETION_THRESHOLD)
    .sort((a, b) => (b.convergence_score ?? 0) - (a.convergence_score ?? 0));
  const incompleteSessions = sessions.filter(
    (s) => (s.convergence_score ?? 0) >= COMPLETION_THRESHOLD && (s.convergence_score ?? 0) < COMPLETED_THRESHOLD
  );
  const completedSessions = sessions.filter((s) => (s.convergence_score ?? 0) >= COMPLETED_THRESHOLD);

  function completionColor(score: number): string {
    if (score <= 33) return "red";
    if (score <= 66) return "yellow";
    return "green";
  }

  function SessionCard({ session }: { session: SessionSummary }) {
    const score = session.convergence_score ?? 0;
    const scheme = completionColor(score);
    const barBg =
      scheme === "red"
        ? "bg-red-500/60"
        : scheme === "yellow"
          ? "bg-yellow-500/60"
          : "bg-green-500/60";
    const textColor =
      scheme === "red"
        ? "text-red-500"
        : scheme === "yellow"
          ? "text-yellow-600 dark:text-yellow-500"
          : "text-green-600 dark:text-green-500";

    return (
      <button
        type="button"
        onClick={() => onSelectSession(session.session_id)}
        className={cn(
          "w-full group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card relative",
          "hover:bg-muted/50 hover:border-primary/20 text-left transition-all",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
      >
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-muted/20">
          {(session.top_album_covers ?? []).length > 0 && !imageErrors[session.session_id] ? (
            <Image
              src={(session.top_album_covers ?? [])[0]}
              alt=""
              width={48}
              height={48}
              className="w-full h-full object-cover"
              onError={() => setImageErrors((prev) => ({ ...prev, [session.session_id]: true }))}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-bold truncate text-foreground">
            {session.primary_artist}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 opacity-50" />
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
                new Date(session.created_at)
              )}
            </span>
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 opacity-50" />
              {session.comparison_count} duels
            </span>
            <span className={cn("flex items-center gap-1 font-semibold", textColor)}>
              <CheckCircle2 className="h-3 w-3 opacity-80" />
              {score}% complete
            </span>
          </div>
        </div>
        <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
        {/* Progress bar (matches navigator green / yellow / red) */}
        <div className="absolute bottom-2 left-4 right-4 h-[2px] bg-primary/10 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barBg)}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 h-full min-h-0 max-h-[calc(100vh-6rem)]",
        isSidebarCollapsed ? "w-full" : "w-full max-w-5xl mx-auto"
      )}
    >
      <h2 className="text-lg font-black uppercase tracking-tighter italic text-foreground text-center shrink-0">
        My rankings
      </h2>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest -mt-2 shrink-0">
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 flex-1 min-h-0 min-w-0">
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            Draft zone
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
            {draftSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
            {draftSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            Progress zone
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
            {incompleteSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
            {incompleteSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">
            Settled zone
          </p>
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
            {completedSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
            {completedSessions.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground/80 py-4 text-center">
                None
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
