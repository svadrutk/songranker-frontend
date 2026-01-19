"use client";

import { useEffect, useState, useCallback, type JSX } from "react";
import { Calendar, Layers, Loader2, PlayCircle, History, CheckCircle2, Trash2 } from "lucide-react";
import { getUserSessions, type SessionSummary, deleteSession } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

type SessionSelectorProps = Readonly<{
  onSelect: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  activeSessionId: string | null;
}>;

export function SessionSelector({ onSelect, onDelete, activeSessionId }: SessionSelectorProps): JSX.Element {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;

    setDeletingId(sessionId);
    try {
      const success = await deleteSession(sessionId);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        onDelete?.(sessionId);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center px-4">
        <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold uppercase text-muted-foreground">No sessions found</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">Start a new ranking by searching for an artist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pr-2 overflow-y-auto custom-scrollbar">
      <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
        Recent Sessions ({sessions.length})
      </h2>
      <div className="space-y-1">
        {sessions.map((session) => (
          <button
            key={session.session_id}
            onClick={() => onSelect(session.session_id)}
            className={cn(
              "w-full group flex flex-col p-3 rounded-md border transition-all text-left relative",
              activeSessionId === session.session_id
                ? "border-white bg-white/5 shadow-xs"
                : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn(
                "font-mono text-xs font-bold truncate flex-1",
                activeSessionId === session.session_id ? "text-white" : ""
              )}>
                {session.primary_artist}
              </span>
              <div className="flex items-center gap-2">
                {deletingId === session.session_id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <button
                    onClick={(e) => handleDelete(e, session.session_id)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <PlayCircle className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  activeSessionId === session.session_id ? "text-primary" : "text-muted-foreground/40"
                )} />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                <Calendar className="h-3 w-3 opacity-50" />
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(session.created_at))}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                <Layers className="h-3 w-3 opacity-50" />
                {session.song_count} songs
              </div>
              <div className="flex items-center gap-1 text-[9px] text-primary/60 uppercase font-bold tracking-tighter">
                <CheckCircle2 className="h-3 w-3 opacity-50" />
                {session.comparison_count} duels
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
