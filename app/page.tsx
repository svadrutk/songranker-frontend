"use client";

import { useState } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
import { type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { DeduplicationModal } from "@/components/DeduplicationModal";
import { findPotentialDuplicates, filterTracks, type DuplicateGroup } from "@/lib/deduplication";

export default function Home() {
  const { user } = useAuth();
  const [selectedReleases, setSelectedReleases] = useState<ReleaseGroup[]>([]);
  const [allTracks, setAllTracks] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<"catalog" | "dedupe" | "ranking">("catalog");
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [finalSongList, setFinalSongList] = useState<string[]>([]);

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
    setView("catalog");
  };

  const handleStartRanking = () => {
    const rawTracks = selectedReleases.flatMap(r => allTracks[r.id] || []);
    const flatTracks = filterTracks(rawTracks);
    const groups = findPotentialDuplicates(flatTracks);
    
    // Simulate background deep deduplication trigger (Phase 2 Roadmap)
    console.log("Triggering deep deduplication for", flatTracks.length, "songs...");

    if (groups.length > 0) {
      setDuplicateGroups(groups);
      setFinalSongList(flatTracks); // We use flatTracks as the base for the modal
      setView("dedupe");
    } else {
      // No duplicates found, go straight to ranking
      setFinalSongList(Array.from(new Set(flatTracks)));
      setView("ranking");
    }
  };

  const handleConfirmDeduplication = (songs: string[]) => {
    setFinalSongList(songs);
    setView("ranking");
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
      <div className="flex-1 h-full p-8 overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
        <RankingWidget 
          selectedReleases={selectedReleases} 
          allTracks={allTracks}
          isRanking={view === "ranking"}
          finalSongList={finalSongList}
        />
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
