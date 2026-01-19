"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  type SessionSong, 
  getSessionSongs, 
  createComparison 
} from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface RankingWidgetProps {
  isRanking?: boolean;
  sessionId?: string | null;
}

export function RankingWidget({ 
  isRanking, 
  sessionId 
}: RankingWidgetProps) {
  const { user, openAuthModal } = useAuth();
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);

  // Initial load of songs
  useEffect(() => {
    if (isRanking && sessionId) {
      const loadSongs = async () => {
        setIsLoading(true);
        try {
          const fetchedSongs = await getSessionSongs(sessionId);
          setSongs(fetchedSongs);
          const firstPair = getNextPair(fetchedSongs);
          setCurrentPair(firstPair);
        } catch (error) {
          console.error("Failed to load session songs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadSongs();
    }
  }, [isRanking, sessionId]);

  const handleChoice = useCallback(async (winner: SessionSong | null, isTie: boolean = false) => {
    if (!currentPair || !sessionId) return;

    const [songA, songB] = currentPair;
    const winnerId = winner?.song_id || null;

    // 1. Optimistic Update
    const scoreA = isTie ? 0.5 : (winnerId === songA.song_id ? 1 : 0);
    const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

    setSongs(prevSongs => prevSongs.map(s => {
      if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
      if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
      return s;
    }));

    setTotalDuels(prev => prev + 1);

    // 2. Prepare next pair immediately for snappy UI
    // We use the potentially updated ratings for the next pairing
    const updatedSongs = songs.map(s => {
      if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
      if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
      return s;
    });
    setCurrentPair(getNextPair(updatedSongs));

    // 3. Sync with Backend
    try {
      await createComparison(sessionId, {
        song_a_id: songA.song_id,
        song_b_id: songB.song_id,
        winner_id: winnerId,
        is_tie: isTie
      });
    } catch (error) {
      console.error("Failed to sync comparison:", error);
      // Optional: Revert optimistic update on failure? 
      // For now, let's keep it simple. The next refresh will fix it.
    }
  }, [currentPair, sessionId, songs]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-8">
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl">
          <div className="flex items-center gap-6 opacity-40 grayscale pointer-events-none scale-90">
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
            <div className="flex flex-col gap-6">
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            </div>
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          </div>
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Authentication Required</h2>
              <p className="text-sm text-muted-foreground font-mono max-w-sm">
                Sign in to search for artists, select albums, and start ranking your favorite tracks.
              </p>
            </div>
            <Button 
              onClick={() => openAuthModal("login")}
              className="px-12 py-6 rounded-xl font-bold uppercase text-lg group"
            >
              <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isRanking || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-8">
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
          <div className="flex items-center gap-6 opacity-40 grayscale pointer-events-none scale-90">
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
            <div className="flex flex-col gap-6">
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            </div>
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          </div>
          <div className="flex flex-col items-center gap-2 opacity-40">
             <Music className="h-8 w-8 mb-2 text-muted-foreground" />
             <p className="text-xs font-mono uppercase tracking-widest font-bold">Select albums from the catalog to start ranking</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading Session Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
            {totalDuels === 0 ? "Starting Your Ranking Session" : `Duel #${totalDuels + 1}`}
          </p>
          <h2 className="text-xl font-mono font-bold truncate max-w-lg">
            Which track do you prefer?
          </h2>
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted-foreground uppercase">
            <span>{songs.length} Tracks</span>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{totalDuels} Comparisons</span>
            </div>
          </div>
        </div>
        
        {currentPair ? (
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              onClick={() => handleChoice(currentPair[0])}
              className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group relative overflow-hidden flex flex-col items-center justify-center p-6 text-center gap-4"
            >
              <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Music className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold leading-tight line-clamp-3">{currentPair[0].name}</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider line-clamp-1">{currentPair[0].artist}</span>
              <div className="mt-auto pt-4 border-t w-full opacity-0 group-hover:opacity-40 transition-opacity">
                <span className="text-[8px] font-mono uppercase">Rating: {Math.round(currentPair[0].local_elo)}</span>
              </div>
            </Button>
            
            <div className="flex flex-col gap-6">
              <Button 
                variant="outline" 
                onClick={() => handleChoice(null, true)}
                className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">It&apos;s a Tie</span>
                  <span className="text-[8px] opacity-40 font-mono uppercase">Equally Good</span>
                </div>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentPair(getNextPair(songs))}
                className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Skip</span>
                  <span className="text-[8px] opacity-40 font-mono uppercase">Can&apos;t Decide</span>
                </div>
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => handleChoice(currentPair[1])}
              className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group relative overflow-hidden flex flex-col items-center justify-center p-6 text-center gap-4"
            >
              <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Music className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold leading-tight line-clamp-3">{currentPair[1].name}</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider line-clamp-1">{currentPair[1].artist}</span>
              <div className="mt-auto pt-4 border-t w-full opacity-0 group-hover:opacity-40 transition-opacity">
                <span className="text-[8px] font-mono uppercase">Rating: {Math.round(currentPair[1].local_elo)}</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs font-mono uppercase">Finding next pairing...</p>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground font-mono">Select the song that is better</p>
      </div>
    </div>
  );
}
