"use client";

import { useState } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
import { type ReleaseGroup } from "@/lib/api";

export default function Home() {
  const [selectedRelease, setSelectedRelease] = useState<ReleaseGroup | null>(null);

  const handleSelect = (release: ReleaseGroup | null, tracks: string[]) => {
    setSelectedRelease(release);
    // Future: Handle tracklist for ranking logic
    if (release) {
      console.log("Selected:", release.title, "Tracks:", tracks.length);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Panel: Catalog */}
      <div className="w-1/3 min-w-[320px] max-w-md border-r bg-muted/10 p-6 flex flex-col h-full">
        <Catalog onSelect={handleSelect} selectedId={selectedRelease?.id || null} />
      </div>

      {/* Right Panel: Ranking */}
      <div className="flex-1 h-full p-8 overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
        <RankingWidget selectedRelease={selectedRelease} />
      </div>
    </main>
  );
}
