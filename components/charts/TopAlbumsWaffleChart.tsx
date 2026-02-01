"use client";

import { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { LeaderboardSong } from "@/lib/api";
import { RANKING_CSS_VARS } from "@/lib/rankingColors";
import { Info } from "lucide-react";

const TOP_N = 20;
const COLS = 5;
const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

type TopAlbumsWaffleChartProps = Readonly<{
  songs: LeaderboardSong[];
}>;

type TooltipState = {
  left: number;
  top: number;
  song: LeaderboardSong;
  index: number;
  medal: "gold" | "silver" | "bronze" | null;
};

export function TopAlbumsWaffleChart({ songs }: TopAlbumsWaffleChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, song: LeaderboardSong, index: number, medal: "gold" | "silver" | "bronze" | null) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltip({
        left: rect.left + rect.width / 2,
        top: rect.top,
        song,
        index,
        medal,
      });
    },
    []
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const { cells, albumColors, albumStats } = useMemo(() => {
    const top20 = songs.slice(0, TOP_N);
    if (top20.length === 0) return { cells: [], albumColors: new Map<string, string>(), albumStats: new Map<string, number>() };

    const albumToColor = new Map<string, string>();
    const albumToCount = new Map<string, number>();
    let colorIndex = 0;
    
    // Build album color map and count songs per album
    for (const s of top20) {
      const key = s.album?.trim() || "Unknown";
      if (!albumToColor.has(key)) {
        albumToColor.set(key, RANKING_CSS_VARS[colorIndex % RANKING_CSS_VARS.length]);
        colorIndex++;
      }
      albumToCount.set(key, (albumToCount.get(key) || 0) + 1);
    }

    const cells = top20.map((song, index) => {
      const albumKey = song.album?.trim() || "Unknown";
      const medal = index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null;
      return {
        song,
        index: index + 1,
        color: albumToColor.get(albumKey)!,
        medal,
      };
    });

    return { cells, albumColors: albumToColor, albumStats: albumToCount };
  }, [songs]);

  if (cells.length === 0) return null;

  return (
    <div className="w-full rounded-lg border border-border/40 bg-card p-4 md:p-5">
      {/* Enhanced header with explanation */}
      <div className="flex flex-col items-center gap-1 mb-4 text-center">
        <div className="flex items-center gap-2">
          <h3 className="text-xs md:text-sm font-black text-foreground uppercase tracking-wide">
            Top 20 Songs by Album
          </h3>
          <div className="shrink-0 group relative">
            <Info className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-popover border border-border rounded-lg shadow-xl z-50 text-xs leading-relaxed text-left">
              <p className="font-semibold mb-1.5">How to read this chart:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Each square represents one ranked song</li>
                <li>• Colors group songs by album</li>
                <li>• Gold/silver/bronze borders = rank 1/2/3</li>
                <li>• Reading order: left to right, top to bottom</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
          Each square = 1 song. Colors = albums. Hover for details.
        </p>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {/* Waffle grid with enhanced visual hierarchy */}
        <div
          className="grid gap-2 min-w-[280px] md:min-w-[320px] max-w-[520px] w-full overflow-visible mx-auto"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            aspectRatio: `${COLS} / ${Math.ceil(TOP_N / COLS)}`,
          }}
        >
          {cells.map(({ song, index, color, medal }) => (
            <div
              key={song.id}
              className={`group relative rounded-md flex items-center justify-center min-w-0 aspect-square transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${medal ? "border-4" : "border-2 border-border/20"}`}
              style={{
                backgroundColor: color,
                borderColor: medal === "gold" ? GOLD : medal === "silver" ? SILVER : medal === "bronze" ? BRONZE : undefined,
              }}
              onMouseEnter={(e) => showTooltip(e, song, index, medal as "gold" | "silver" | "bronze" | null)}
              onMouseLeave={hideTooltip}
              aria-label={`Rank ${index}: ${song.name} from ${song.album || "Unknown"}`}
            >
              {/* Show rank number for top 10 to improve scannability */}
              {index <= 10 && (
                <span
                  className={`inline-flex items-center justify-center font-mono font-black text-xs md:text-sm rounded px-1.5 py-0.5 ${
                    medal ? "bg-black/90 min-w-[2rem] min-h-[2rem]" : "bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  }`}
                  style={{
                    color: medal === "gold" ? GOLD : medal === "silver" ? SILVER : medal === "bronze" ? BRONZE : "#fff",
                  }}
                >
                  {index}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced legend with song counts - now below the waffle on all screens */}
        <div className="flex flex-col gap-2 w-full max-w-[520px] mx-auto">
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Albums ({albumColors.size})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5 text-xs font-mono">
            {Array.from(albumColors.entries())
              .sort((a, b) => (albumStats.get(b[0]) || 0) - (albumStats.get(a[0]) || 0)) // Sort by count descending
              .map(([album, color]) => {
                const count = albumStats.get(album) || 0;
                const plural = count === 1 ? 'song' : 'songs';
                return (
                  <div key={album} className="flex items-start gap-2 group/legend min-w-0">
                    <span
                      className="w-3.5 h-3.5 md:w-4 md:h-4 rounded shrink-0 border border-border/20 group-hover/legend:scale-110 transition-transform mt-0.5"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0 leading-snug">
                      <div className="text-foreground break-words" title={album}>
                        {album}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {count} {plural}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Enhanced tooltip with better context */}
      {tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] px-3 py-2.5 rounded-lg bg-popover border-2 border-border shadow-2xl max-w-[240px] text-left pointer-events-none"
            style={{
              left: tooltip.left,
              top: tooltip.top,
              transform: "translate(-50%, -100%) translateY(-8px)",
            }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-black text-xs uppercase tracking-wider text-primary">
                  #{tooltip.index}
                </span>
                {tooltip.medal && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{
                      color: tooltip.medal === "gold" ? GOLD : tooltip.medal === "silver" ? SILVER : BRONZE,
                      backgroundColor: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {tooltip.medal}
                  </span>
                )}
              </div>
              <div className="font-semibold text-sm leading-snug" title={tooltip.song.name}>
                {tooltip.song.name}
              </div>
              <div className="text-xs text-muted-foreground leading-snug" title={tooltip.song.album || "Unknown"}>
                {tooltip.song.album || "Unknown"}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
