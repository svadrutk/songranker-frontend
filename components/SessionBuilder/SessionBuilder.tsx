"use client";

import { useState, useEffect, type JSX } from "react";
import { useSessionBuilderStore, useNavigationStore } from "@/lib/store";
import { UnifiedSearchBar } from "./UnifiedSearchBar";
import { SourceCard } from "./SourceCard";
import { InlineArtistSelector } from "./InlineArtistSelector";
import { 
  suggestArtists, 
  searchArtistReleaseGroups, 
  getReleaseGroupTracks, 
  importPlaylist, 
  getSessionDetail, 
  type ReleaseGroup, 
  type SongInput,
  type SessionSong
} from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, Music, Link as LinkIcon, Clock } from "lucide-react";

export function SessionBuilder(): JSX.Element {
  const { sources, addSource, removeSource, resetDraft, status, setStatus, updateSource } = useSessionBuilderStore();
  const { setView } = useNavigationStore();
  
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Artist selection state
  const [searchingArtist, setSearchingArtist] = useState<{name: string} | null>(null);
  const [artistReleases, setArtistReleases] = useState<ReleaseGroup[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2 || trimmed.startsWith("http") || searchingArtist) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    suggestArtists(trimmed)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => {
        setLoadingSuggestions(false);
        setShowSuggestions(true);
      });
  }, [debouncedQuery, searchingArtist]);

  const handleSuggestionClick = async (suggestion: string) => {
    setShowSuggestions(false);
    setSearchingArtist({ name: suggestion });
    setLoadingReleases(true);
    setStatus('building');
    
    try {
      const releases = await searchArtistReleaseGroups(suggestion);
      setArtistReleases(releases);
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoadingReleases(false);
    }
  };

  const handleAddArtistReleases = async (selectedReleases: ReleaseGroup[]) => {
    if (!searchingArtist) return;
    
    const sourceId = `artist-${Date.now()}`;
    const artistName = searchingArtist.name;
    
    // Add pending source
    addSource({
      id: sourceId,
      type: 'artist_partial',
      name: artistName,
      artistName: artistName,
      songCount: 0,
      status: 'loading',
      progress: 10,
      data: { 
        artistId: selectedReleases[0]?.id || 'unknown',
        selectedReleaseIds: selectedReleases.map(r => r.id) 
      }
    });
    
    setSearchingArtist(null);
    setArtistReleases([]);

    try {
      let totalSongs = 0;
      let processed = 0;
      const sourceTracks: SongInput[] = [];
      
      for (const release of selectedReleases) {
        const tracks = await getReleaseGroupTracks(release.id);
        const mapped: SongInput[] = tracks.map(t => ({
          name: t,
          artist: artistName,
          album: release.title,
          cover_url: release.cover_art?.url || `https://coverartarchive.org/release-group/${release.id}/front-250`,
          spotify_id: null
        }));
        sourceTracks.push(...mapped);
        totalSongs += tracks.length;
        processed++;
        updateSource(sourceId, { progress: 10 + (processed / selectedReleases.length) * 80 });
      }
      
      updateSource(sourceId, {
        songCount: totalSongs,
        status: 'ready',
        progress: 100,
        resolvedTracks: sourceTracks,
        coverUrl: selectedReleases[0]?.cover_art?.url
      });
    } catch {
      updateSource(sourceId, { status: 'error' });
    }
  };

  const handleImportPlaylist = async (url: string) => {
    const tempId = `playlist-${Date.now()}`;
    addSource({
      id: tempId,
      type: 'playlist',
      name: 'Playlist from Link',
      songCount: 0,
      status: 'loading',
      progress: 10,
      data: { platform: url.includes('spotify') ? 'spotify' : 'apple', playlistId: url }
    });
    setQuery("");
    setStatus('building');

    try {
      const response = await importPlaylist({ url });
      
      // Fetch session details to get actual songs and count
      const details = await getSessionDetail(response.session_id);
      if (!details) throw new Error("Failed to fetch session details");
      
      const mappedSongs: SongInput[] = details.songs.map((s: SessionSong) => ({
        name: s.name || "Unknown",
        artist: s.artist || "Unknown",
        album: s.album || null,
        cover_url: s.cover_url || null,
        spotify_id: s.spotify_id || null
      }));

      updateSource(tempId, {
        name: details.songs[0]?.artist ? `${details.songs[0].artist} Mix` : 'Imported Playlist',
        songCount: mappedSongs.length,
        status: 'ready',
        progress: 100,
        resolvedTracks: mappedSongs,
        coverUrl: mappedSongs[0]?.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop'
      });
    } catch (err) {
      console.error("Playlist import failed:", err);
      updateSource(tempId, { 
        status: 'error',
        name: 'Import Failed',
        songCount: 0
      });
    }
  };

  const totalSongs = sources.reduce((acc, s) => acc + s.songCount, 0);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 md:px-8 py-12 gap-12 overflow-y-auto custom-scrollbar">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Mix your favorite playlists and artists into a single ranking session. 
          The ultimate way to compare your taste across sources.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto sticky top-0 z-30">
        <UnifiedSearchBar 
          query={query}
          onQueryChange={setQuery}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          loadingSuggestions={loadingSuggestions}
          onSuggestionClick={handleSuggestionClick}
          onImportPlaylist={handleImportPlaylist}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
      </div>

      {searchingArtist ? (
        <div className="w-full animate-in slide-in-from-top-8 duration-500">
          <InlineArtistSelector 
            artistName={searchingArtist.name}
            releases={artistReleases}
            loading={loadingReleases}
            onAdd={handleAddArtistReleases}
            onCancel={() => {
              setSearchingArtist(null);
              setArtistReleases([]);
            }}
          />
        </div>
      ) : sources.length > 0 && status !== 'empty' ? (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-black uppercase tracking-widest text-primary/60 text-sm">
              Your Session Draft ({sources.length} {sources.length === 1 ? 'source' : 'sources'} • {totalSongs} songs)
            </h2>
            <button 
              onClick={resetDraft}
              className="flex items-center gap-2 text-[10px] font-mono font-black text-muted-foreground hover:text-destructive transition-colors uppercase tracking-[0.2em]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map(source => (
              <SourceCard key={source.id} source={source} onRemove={removeSource} />
            ))}
          </div>

          <div className="flex justify-center pt-12">
            <Button 
              size="lg"
              disabled={sources.some(s => s.status === 'loading') || sources.length === 0}
              onClick={() => setView("review")}
              className="h-20 px-12 rounded-3xl bg-primary text-primary-foreground font-mono font-black uppercase tracking-[0.2em] text-xl hover:scale-105 active:scale-95 transition-all group shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 disabled:hover:scale-100"
            >
              Next: Review & Clean <ArrowRight className="ml-4 h-7 w-7 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 pb-12">
          <button 
            className="bg-muted/10 p-10 rounded-[2.5rem] border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-6"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform group-hover:rotate-3">
              <LinkIcon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-2 text-lg">Playlist Link</h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                Paste a Spotify or Apple Music playlist link to import all tracks instantly.
              </p>
            </div>
          </button>

          <button 
            className="bg-muted/10 p-10 rounded-[2.5rem] border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-6"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform group-hover:-rotate-3">
              <Music className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-2 text-lg">Search Artist</h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                Find your favorite artists and manually select which albums or songs to rank.
              </p>
            </div>
          </button>

          <button 
            onClick={() => setStatus('building')}
            disabled={sources.length === 0}
            className="bg-muted/10 p-10 rounded-[2.5rem] border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-6 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-2 text-lg">Resume Draft</h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {sources.length > 0 
                  ? `Continue building your session with ${sources.length} sources currently in your draft.`
                  : "Start building a new session to see your progress saved here automatically."}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
