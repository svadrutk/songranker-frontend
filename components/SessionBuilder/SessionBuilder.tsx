"use client";

import { useState, useEffect, type JSX } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSessionBuilderStore } from "@/lib/store";
import { useRouter } from "next/navigation";
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
import { Trash2, ArrowRight, Music } from "lucide-react";
import { SiSpotify, SiApplemusic } from "@icons-pack/react-simple-icons";
import { cn } from "@/lib/utils";

export function SessionBuilder(): JSX.Element {
  const router = useRouter();
  const { sources, addSource, removeSource, resetDraft, setStatus, updateSource } = useSessionBuilderStore();
  
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Artist selection state
  const [searchingArtist, setSearchingArtist] = useState<{name: string} | null>(null);
  const [artistReleases, setArtistReleases] = useState<ReleaseGroup[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  
  // Playlist import state
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const debouncedQuery = useDebouncedValue(query, 300);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const trimmed = val.trim();
    // If user starts typing something new (different from the current artist)
    if (searchingArtist && trimmed !== searchingArtist.name && trimmed.length > 0) {
      setSearchingArtist(null);
      setArtistReleases([]);
    }
  };

  useEffect(() => {
    const dTrimmed = debouncedQuery.trim();
    if (dTrimmed.length < 2 || dTrimmed.startsWith("http") || (searchingArtist && dTrimmed === searchingArtist.name)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    suggestArtists(dTrimmed)
      .then((newSuggestions) => {
        // Only update if we're still looking for suggestions for THIS specific query
        // and we haven't already selected an artist in the meantime
        if (!searchingArtist || dTrimmed !== searchingArtist.name) {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        }
      })
      .catch(() => setSuggestions([]))
      .finally(() => {
        setLoadingSuggestions(false);
      });
  }, [debouncedQuery, searchingArtist]);

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery(suggestion);
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
    setQuery("");
    setShowSuggestions(false);
    setSuggestions([]);

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

  const handleImportPlaylist = (url: string) => {
    setPendingUrl(url);
    setShowImportModal(true);
  };

  const executeImport = async (limit: number | null) => {
    if (!pendingUrl) return;
    const url = pendingUrl;
    setPendingUrl(null);
    setShowImportModal(false);

    // Clean URL: Remove query parameters like ?si=... which can cause backend parsing issues
    const cleanUrl = url.split('?')[0];
    
    const tempId = `playlist-${Date.now()}`;
    addSource({
      id: tempId,
      type: 'playlist',
      name: 'Playlist from Link',
      songCount: 0,
      status: 'loading',
      progress: 10,
      data: { platform: cleanUrl.includes('spotify') ? 'spotify' : 'apple', playlistId: cleanUrl }
    });
    setQuery("");
    setStatus('building');

    try {
      const response = await importPlaylist({ 
        url: cleanUrl, 
        limit,
        rank_mode: limit ? "quick_rank" : "rank_all"
      });
      
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
        name: details.playlist_name || (details.songs[0]?.artist ? `${details.songs[0].artist} Mix` : 'Imported Playlist'),
        songCount: mappedSongs.length,
        status: 'ready',
        progress: 100,
        resolvedTracks: mappedSongs,
        coverUrl: details.image_url || mappedSongs[0]?.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop'
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
    <div className="flex flex-col md:flex-row h-full w-full max-w-(--breakpoint-2xl) mx-auto overflow-hidden relative">
      <AnimatePresence>
        {showImportModal && (
          <PlaylistImportModal 
            url={pendingUrl}
            onConfirm={executeImport} 
            onCancel={() => setShowImportModal(false)} 
          />
        )}
      </AnimatePresence>
      {/* Left Column: Search & Discovery */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-8 lg:p-12 gap-8 overflow-y-auto custom-scrollbar">
        {/* Punchy Minimalist Header - Smaller for compact layout */}
        <div className="flex flex-col items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
            FIND YOUR FAVORITES<span className="text-primary">.</span>
          </h1>
        </div>

        <div className="w-full sticky top-0 z-30">
          <UnifiedSearchBar 
            query={query}
            onQueryChange={handleQueryChange}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            loadingSuggestions={loadingSuggestions}
            onSuggestionClick={handleSuggestionClick}
            onImportPlaylist={handleImportPlaylist}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>

        <div className="flex-1 min-h-0">
          {searchingArtist && (
            <div className="w-full animate-in slide-in-from-top-4 duration-500">
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
          )}
        </div>
      </div>

      {/* Right Column: Your Selection Sidebar */}
      <div className="w-full md:w-[400px] lg:w-[450px] shrink-0 border-t md:border-t-0 md:border-l border-border/10 bg-muted/5 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col h-full gap-6">
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-mono font-black uppercase tracking-widest text-primary/80 text-xs">
                Your Selection
              </h2>
              <div className="flex gap-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest opacity-60">
                  {sources.length} sources
                </span>
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                  {totalSongs} songs
                </span>
              </div>
            </div>
            
            {sources.length > 0 && (
              <button 
                onClick={resetDraft}
                className="text-muted-foreground hover:text-destructive transition-colors font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {sources.length > 0 ? (
              <div className="flex flex-col gap-4 py-2">
                {sources.map(source => (
                  <SourceCard key={source.id} source={source} onRemove={removeSource} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4 opacity-30">
                <Music className="h-12 w-12" />
                <p className="font-mono text-xs uppercase font-black tracking-widest">
                  Nothing selected yet
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto">
            <Button 
              size="lg"
              disabled={sources.some(s => s.status === 'loading') || sources.length === 0}
              onClick={() => router.push("/review")}
              className="w-full h-20 rounded-2xl bg-primary text-primary-foreground font-mono font-black uppercase tracking-[0.1em] text-xl hover:scale-[1.02] active:scale-95 transition-all group shadow-2xl disabled:opacity-50"
            >
              <span className="flex items-center gap-4">
                START RANKING <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type PlaylistImportModalProps = Readonly<{
  url: string | null;
  onConfirm: (limit: number | null) => void;
  onCancel: () => void;
}>;

function PlaylistImportModal({ url, onConfirm, onCancel }: PlaylistImportModalProps): JSX.Element {
  // Use the refined logarithmic estimation logic (consistent with ProgressSection)
  const getEst = (n: number) => Math.ceil(n * Math.log2(n) * 0.7 + 20);
  const est50 = getEst(50);

  // URL detection and service identification
  const getServiceInfo = (val: string | null) => {
    if (!val) return null;
    if (/spotify\.com\/playlist\/([a-zA-Z0-9]+)/.test(val)) {
      return { type: 'spotify', label: 'Spotify', color: 'text-[#1DB954]', bgColor: 'bg-[#1DB954]/10', Icon: SiSpotify };
    }
    if (/music\.apple\.com\/[a-z]{2}\/playlist\/[a-zA-Z0-9.\-]+\/(pl\.[a-f0-9]+)/.test(val)) {
      return { type: 'apple', label: 'Apple Music', color: 'text-[#FC3C44]', bgColor: 'bg-[#FC3C44]/10', Icon: SiApplemusic };
    }
    return null;
  };

  const serviceInfo = getServiceInfo(url);
  const Icon = serviceInfo?.Icon || Music;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border-2 border-border p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-8"
      >
        <div className="space-y-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors", serviceInfo?.bgColor || "bg-primary/10", serviceInfo?.color || "text-primary")}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-mono text-2xl font-black uppercase tracking-tight">Import Playlist</h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Large {serviceInfo?.label || "playlists"} take longer to rank. To find a solid Top 10, we recommend starting with a smaller set.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => onConfirm(50)}
            className="group flex flex-col items-start gap-1 p-5 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-mono font-black uppercase tracking-widest text-sm group-hover:text-primary transition-colors">Import First 50</span>
              <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Fastest</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">~{est50} duels needed for Top 10</p>
          </button>

          <button
            onClick={() => onConfirm(null)}
            className="group flex flex-col items-start gap-1 p-5 rounded-2xl border-2 border-transparent bg-muted/5 hover:border-border transition-all text-left"
          >
            <span className="font-mono font-black uppercase tracking-widest text-sm opacity-60 group-hover:opacity-100 transition-opacity">Import All Songs</span>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-50 group-hover:opacity-80 transition-opacity">Effort scales with library size</p>
          </button>
        </div>

        <div className="flex gap-4 pt-2">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="flex-1 font-mono uppercase font-black tracking-widest text-xs h-12"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(50)}
            className={cn(
              "flex-1 text-primary-foreground font-mono uppercase font-black tracking-widest text-xs h-12 rounded-xl shadow-lg transition-all group",
              serviceInfo?.type === 'spotify' ? "bg-[#1DB954] shadow-[#1DB954]/20 hover:bg-[#1DB954]/90" : 
              serviceInfo?.type === 'apple' ? "bg-[#FC3C44] shadow-[#FC3C44]/20 hover:bg-[#FC3C44]/90" : 
              "bg-primary shadow-primary/20"
            )}
          >
            LET&apos;S GO <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
