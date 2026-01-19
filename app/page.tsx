"use client";

import { useState } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
import { createSession, type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { DeduplicationModal } from "@/components/DeduplicationModal";
import { findPotentialDuplicates, filterTracks, type DuplicateGroup, prepareSongInputs } from "@/lib/deduplication";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  const [selectedReleases, setSelectedReleases] = useState<ReleaseGroup[]>([]);
  const [allTracks, setAllTracks] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<"catalog" | "dedupe" | "ranking">("catalog");
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [finalSongList, setFinalSongList] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (release: ReleaseGroup, tracks: string[]) => {
    setSelectedReleases(prev => {
      const isSelected = prev.some(r => r.id === release.id);
      if (isSelected && tracks.length === 0) {
        // Remove
        return prev.filter(r => r.id !== release.id);
      } else if (isSelected) {
        // Update tracks if they weren't there before
        setAllTracks(t => ({ ...t, [release.id]: tracks }));
        return prev;
      } else {
        // Add
        setAllTracks(t => ({ ...t, [release.id]: tracks }));
        return [...prev, release];
      }
    });
  };

  const handleSearchStart = () => {
    setSelectedReleases([]);
    setAllTracks({});
    setSessionId(null);
    setError(null);
    setView("catalog");
  };

  const startRankingSession = async (songs: string[]) => {
    setIsCreatingSession(true);
    setError(null);
    
    const songInputs = prepareSongInputs(songs, selectedReleases, allTracks);

    try {
      const session = await createSession({
        user_id: user?.id,
        songs: songInputs
      });
      setSessionId(session.session_id);
      setView("ranking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize ranking session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleStartRanking = async () => {
    const rawTracks = selectedReleases.flatMap(r => allTracks[r.id] || []);
    const flatTracks = filterTracks(rawTracks);
    const groups = findPotentialDuplicates(flatTracks);
    
    if (groups.length > 0) {
      setDuplicateGroups(groups);
      setFinalSongList(flatTracks);
      setView("dedupe");
    } else {
      const uniqueTracks = Array.from(new Set(flatTracks));
      setFinalSongList(uniqueTracks);
      await startRankingSession(uniqueTracks);
    }
  };

  const handleConfirmDeduplication = async (songs: string[]) => {
    setFinalSongList(songs);
    await startRankingSession(songs);
  };

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Catalog */}
      <div className="w-1/3 min-w-[320px] max-w-md border-r bg-muted/10 p-6 flex flex-col h-full">
        <Catalog 
          onToggle={handleToggle} 
          onSearchStart={handleSearchStart}
          onStartRanking={handleStartRanking}
          selectedIds={selectedReleases.map(r => r.id)} 
        />
      </div>

      {/* Right Panel: Ranking */}
      <div className="flex-1 h-full p-8 overflow-hidden bg-linear-to-br from-background via-background to-primary/5 relative">
        <RankingWidget 
          isRanking={view === "ranking"}
          sessionId={sessionId}
        />

        {/* Loading Overlay */}
        {isCreatingSession && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold font-mono uppercase tracking-tight">Initializing Session</h3>
              <p className="text-xs text-muted-foreground font-mono">Setting up your ranking environment...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && !isCreatingSession && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300 p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-bold font-mono uppercase tracking-tight text-destructive">Initialization Failed</h3>
              <p className="text-sm text-muted-foreground font-mono">
                {error}
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setError(null)}
                className="font-mono uppercase tracking-widest text-xs py-6 px-8"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => startRankingSession(finalSongList)}
                className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs py-6 px-8"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      <DeduplicationModal
        isOpen={view === "dedupe"}
        onClose={() => setView("catalog")}
        onConfirm={handleConfirmDeduplication}
        duplicateGroups={duplicateGroups}
        allSongs={finalSongList}
      />
    </div>
  );
}
