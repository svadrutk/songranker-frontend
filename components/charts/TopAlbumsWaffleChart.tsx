"use client";

import { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { LeaderboardSong } from "@/lib/api";
import { RANKING_CSS_VARS } from "@/lib/rankingColors";

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

  const { cells, albumColors } = useMemo(() => {
    const top20 = songs.slice(0, TOP_N);
    if (top20.length === 0) return { cells: [], albumColors: new Map<string, string>() };

    const albumToColor = new Map<string, string>();
    let colorIndex = 0;
    for (const s of top20) {
      const key = s.album?.trim() || "Unknown";
      if (!albumToColor.has(key)) {
        albumToColor.set(key, RANKING_CSS_VARS[colorIndex % RANKING_CSS_VARS.length]);
        colorIndex++;
      }
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

    return { cells, albumColors: albumToColor };
  }, [songs]);

  if (cells.length === 0) return null;

  return (
    <div className="w-full rounded-lg border border-border/40 bg-card p-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
        Top 20 by album (waffle)
      </p>
      <div className="flex flex-row gap-4 items-start">
        <div
          className="grid gap-2 min-w-[320px] max-w-[520px] w-full shrink-0 overflow-visible"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            aspectRatio: `${COLS} / ${Math.ceil(TOP_N / COLS)}`,
          }}
        >
          {cells.map(({ song, index, color, medal }) => (
            <div
              key={song.id}
              className={`group relative rounded-md flex items-center justify-center min-w-0 aspect-square transition-opacity hover:opacity-90 ${medal ? "border-4" : "border-2"}`}
              style={{
                backgroundColor: color,
                borderColor: medal === "gold" ? GOLD : medal === "silver" ? SILVER : medal === "bronze" ? BRONZE : "transparent",
              }}
              onMouseEnter={(e) => showTooltip(e, song, index, medal)}
              onMouseLeave={hideTooltip}
            >
              {medal && (
                <span
                  className="inline-flex items-center justify-center min-w-[2rem] min-h-[2rem] px-1.5 rounded-md font-mono font-black text-base bg-black/85"
                  style={{
                    color: medal === "gold" ? GOLD : medal === "silver" ? SILVER : BRONZE,
                  }}
                >
                  {index}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-y-1.5 text-[10px] font-mono text-muted-foreground shrink-0 pr-4">
          {Array.from(albumColors.entries()).map(([album, color]) => (
            <span key={album} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[140px]" title={album}>
                {album}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Tooltip rendered in portal so it is not clipped by overflow ancestors */}
      {tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] px-2.5 py-2 rounded-md bg-popover border border-border text-popover-foreground text-xs font-medium shadow-lg max-w-[220px] text-left pointer-events-none"
            style={{
              left: tooltip.left,
              top: tooltip.top,
              transform: "translate(-50%, -100%) translateY(-6px)",
            }}
          >
            {tooltip.medal && (
              <div className="font-mono font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Rank {tooltip.index}
              </div>
            )}
            <div className="truncate" title={tooltip.song.name}>
              {tooltip.song.name}
            </div>
            <div className="truncate text-muted-foreground" title={tooltip.song.album || "Unknown"}>
              {tooltip.song.album || "Unknown"}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
