"use client";

import { useEffect, useState, useCallback, type JSX } from "react";
import { Calendar, Layers, Loader2, PlayCircle, History, CheckCircle2, Trash2, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import { getUserSessions, type SessionSummary, deleteSession } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const loadSessions = useCallback(async (showLoading = true) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const cacheKey = `sr_sessions_${user.id}`;
    
    // 1. Try to load from cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Check if cached data is missing the convergence_score field
        const needsUpdate = parsed.length > 0 && !('convergence_score' in parsed[0]);
        if (!needsUpdate) {
          setSessions(parsed);
          if (showLoading) setLoading(false);
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    } else if (showLoading) {
      setLoading(true);
    }

    // 2. Fetch fresh data from API
    try {
      const data = await getUserSessions(user.id);
      
      if (Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error("[SessionSelector] Failed to load sessions:", error);
      localStorage.removeItem(cacheKey);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId || !user) return;

    const sessionId = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(sessionId);
    try {
      const success = await deleteSession(sessionId);
      if (success) {
        setSessions((prev) => {
          const updated = prev.filter((s) => s.session_id !== sessionId);
          localStorage.setItem(`sr_sessions_${user.id}`, JSON.stringify(updated));
          return updated;
        });
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
        <p className="text-xs font-mono uppercase tracking-widest">Loading Rankings...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    if (!user) return <div className="py-12" />; 
    
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center px-4">
        <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold uppercase text-muted-foreground">No rankings found</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">Start a new ranking by searching for an artist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pr-2 overflow-y-auto custom-scrollbar">
      <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
        Recent Rankings ({sessions.length})
      </h2>
      <div className="space-y-1">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            onClick={() => onSelect(session.session_id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(session.session_id);
              }
            }}
            className={cn(
              "w-full group flex items-center gap-3 pt-3 px-3 pb-4 rounded-md border transition-all text-left relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
              activeSessionId === session.session_id
                ? "border-primary/40 bg-primary/5 shadow-xs"
                : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
            )}
          >
            {/* Album Cover Stack */}
            <div className="relative w-10 h-10 shrink-0">
              {(session.top_album_covers || []).length === 0 || imageErrors[session.session_id] ? (
                <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-muted-foreground/40" />
                </div>
              ) : (
                <>
                  <Image
                    src={(session.top_album_covers || [])[0]}
                    alt="Album cover"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover shadow-sm relative z-10"
                    onError={() => setImageErrors(prev => ({ ...prev, [session.session_id]: true }))}
                    unoptimized
                  />
                  {(session.top_album_covers || []).length > 1 && (
                    <Image
                      src={(session.top_album_covers || [])[1]}
                      alt="Album cover"
                      width={40}
                      height={40}
                      className="absolute left-1.5 top-1.5 w-full h-full object-cover shadow-sm border-2 border-background z-0"
                      onError={() => setImageErrors(prev => ({ ...prev, [session.session_id]: true }))}
                      unoptimized
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn(
                  "font-mono text-xs font-bold truncate flex-1",
                  activeSessionId === session.session_id ? "text-primary" : ""
                )}>
                  {session.primary_artist}
                </span>
                <div className="flex items-center gap-2">
                  {deletingId === session.session_id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(e, session.session_id)}
                      className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
                      title="Delete Ranking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {(session.convergence_score || 0) >= 90 ? (
                    <CheckCircle2 className={cn(
                      "h-4 w-4 text-green-500 transition-transform group-hover:scale-110",
                      activeSessionId === session.session_id ? "opacity-100" : "opacity-80"
                    )} />
                  ) : (
                    <PlayCircle className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      activeSessionId === session.session_id ? "text-primary" : "text-muted-foreground/40"
                    )} />
                  )}
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
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-1.5 left-3 right-3 h-[1.5px] bg-primary/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${session.convergence_score || 0}%` }}
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  (session.convergence_score || 0) <= 33 ? "bg-red-500/60" : 
                  (session.convergence_score || 0) <= 66 ? "bg-yellow-500/60" : 
                  "bg-green-500/60"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        artistName={sessions.find(s => s.session_id === confirmDeleteId)?.primary_artist || ""}
      />
    </div>
  );
}

type DeleteConfirmationModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  artistName: string;
}>;

function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  artistName 
}: DeleteConfirmationModalProps): JSX.Element | null {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;


  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-card border border-border/40 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-destructive/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={onClose}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>

              <div className="space-y-3 mb-8 text-center">
                <h3 className="text-xl font-mono font-bold uppercase tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                  Permanently remove ranking for <span className="text-foreground font-bold">{artistName}</span>? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 font-mono uppercase tracking-widest text-[10px] font-bold h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-mono uppercase tracking-widest text-[10px] font-bold h-11 rounded-xl shadow-lg shadow-destructive/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
