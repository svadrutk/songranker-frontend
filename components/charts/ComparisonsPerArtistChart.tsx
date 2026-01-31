"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo, useEffect, useState } from "react";
import type { ArtistWithLeaderboard } from "@/lib/api";
import { RANKING_HEX } from "@/lib/rankingColors";

/** Fisher–Yates shuffle; returns a new array so RANKING_HEX is not mutated. */
function shuffle<T>(array: readonly T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const TOP_N = 10;
const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";
const OUTLINE_BLACK = "#000000";
// Average of top-3 outline (5) and next-7 outline (1.5): (3*5 + 7*1.5)/10
const OUTLINE_WIDTH = (3 * 5 + 7 * 1.5) / 10;
// Top 3 ranks: 15% thicker outline
const OUTLINE_WIDTH_TOP3 = OUTLINE_WIDTH * 1.15;

/** Standard competition ranking: ties get same rank, next rank = 1 + count of people strictly ahead. */
function computeRanks(counts: number[]): number[] {
  return counts.map((count, i) => {
    const ahead = counts.filter((c) => c > count).length;
    return ahead + 1;
  });
}

/** Tie-break when rank is equal: total_comparisons desc, then artist name asc. Same as View Artist Leaderboard modal. */
function sortByRankThenTieBreak(
  artists: ArtistWithLeaderboard[],
  ranks: number[]
): { artists: ArtistWithLeaderboard[]; ranks: number[] } {
  const combined = artists.map((a, i) => ({ artist: a, rank: ranks[i] }));
  combined.sort(
    (a, b) =>
      a.rank !== b.rank
        ? a.rank - b.rank
        : b.artist.total_comparisons !== a.artist.total_comparisons
          ? b.artist.total_comparisons - a.artist.total_comparisons
          : a.artist.artist.localeCompare(b.artist.artist, undefined, { sensitivity: "base" })
  );
  return {
    artists: combined.map((c) => c.artist),
    ranks: combined.map((c) => c.rank),
  };
}

function outlineColorForRank(rank: number): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILVER;
  if (rank === 3) return BRONZE;
  return OUTLINE_BLACK;
}

// Load Plot only on client to avoid SSR/window issues
const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
);

type ComparisonsPerArtistChartProps = Readonly<{
  artists: ArtistWithLeaderboard[];
  onSelectArtist?: (artist: string) => void;
  /** When set (e.g. navigator closed), chart uses this height for taller bars. */
  height?: number;
}>;

function getThemeColors() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { font: "#e5e5e5", bar: "oklch(0.646 0.222 41.116)" };
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return {
    font: style.getPropertyValue("--foreground").trim() || "oklch(0.25 0 0)",
    bar: style.getPropertyValue("--chart-1").trim() || "oklch(0.488 0.243 264.376)",
  };
}

const DEFAULT_CHART_HEIGHT = 280;

export function ComparisonsPerArtistChart({
  artists,
  onSelectArtist,
  height = DEFAULT_CHART_HEIGHT,
}: ComparisonsPerArtistChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = useMemo(() => getThemeColors(), [resolvedTheme]);
  const [paperColor, setPaperColor] = useState<string | null>(null);

  // Resolve --background to a value Plotly accepts (rgb/rgba). Run when theme is ready.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    el.style.setProperty("background-color", "var(--background)");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "0";
    document.body.appendChild(el);
    const bg = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") setPaperColor(bg);
  }, [resolvedTheme]);

  const topArtistsRaw = useMemo(() => artists.slice(0, TOP_N), [artists]);

  // Same tie-break as View Artist Leaderboard modal: rank asc, total_comparisons desc, artist name asc
  const { artists: topArtists, ranks: topRanks } = useMemo(() => {
    if (topArtistsRaw.length === 0) return { artists: [] as ArtistWithLeaderboard[], ranks: [] as number[] };
    const counts = topArtistsRaw.map((a) => a.total_comparisons);
    const ranks = computeRanks(counts);
    return sortByRankThenTieBreak(topArtistsRaw, ranks);
  }, [topArtistsRaw]);

  // Random palette once per mount so bar colors change each time you open Analytics.
  const shuffledColors = useMemo(() => shuffle(RANKING_HEX), []);

  const data = useMemo(() => {
    const contributorLabel = (n: number) =>
      n === 1 ? "1 Contributor" : `${n} Contributors`;
    const outlineColors = topRanks.map(outlineColorForRank);
    const outlineWidths = topRanks.map((r) => (r <= 3 ? OUTLINE_WIDTH_TOP3 : OUTLINE_WIDTH));
    return [
      {
        type: "bar" as const,
        x: topArtists.map((a) => a.artist),
        y: topArtists.map((a) => a.total_comparisons),
        text: topRanks.map(String),
        textposition: "outside" as const,
        textfont: { size: 12, color: colors.font, family: "var(--font-geist-sans), sans-serif" },
        customdata: topArtists.map((a) => contributorLabel(a.total_comparisons)),
        marker: {
          color: topArtists.map((_, i) => shuffledColors[i % shuffledColors.length]),
          line: {
            color: outlineColors,
            width: outlineWidths,
          },
        },
        hovertemplate: "%{x}<br>%{customdata}<extra></extra>",
      },
    ];
  }, [topArtists, topRanks, colors.font, shuffledColors]);

  const yRange = useMemo(() => {
    if (topArtists.length === 0) return [0, 5] as [number, number];
    const maxY = Math.max(...topArtists.map((a) => a.total_comparisons), 1);
    return [0, maxY + 1.5] as [number, number];
  }, [topArtists]);

  const xRange = useMemo(
    () =>
      topArtists.length > 0
        ? [-0.85, topArtists.length - 0.5 + 0.7] as [number, number]
        : undefined,
    [topArtists.length]
  );

  const layout = useMemo(
    () => ({
      title: { text: "Top 10 Most Ranked Artists on ChorusBoard", font: { size: 14 } },
      xaxis: {
        title: "Artist",
        tickangle: -45,
        tickfont: { size: 11 },
        range: xRange,
      },
      yaxis: {
        title: "Unique contributors",
        dtick: 1,
        tickformat: ",d",
        range: yRange,
      },
      height,
      autosize: true,
      margin: { t: 100, r: 72, b: 100, l: 88 },
      paper_bgcolor: paperColor ?? "rgb(250, 250, 250)",
      plot_bgcolor: paperColor ?? "rgb(250, 250, 250)",
      font: { color: colors.font, family: "var(--font-geist-sans), sans-serif" },
      showlegend: false,
      hoverlabel: {
        bgcolor: "rgba(255, 255, 255, 0.95)",
        bordercolor: "rgba(0, 0, 0, 0.1)",
        font: { color: "rgb(25, 25, 25)", family: "var(--font-geist-sans), sans-serif", size: 12 },
      },
    }),
    [paperColor, colors.font, yRange, height, xRange]
  );

  // No mode bar (no camera, zoom, etc.) so it matches the waffle chart, which has no toolbar.
  const config = useMemo(
    () => ({
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
    }),
    []
  );

  const handleClick = useMemo(() => {
    if (!onSelectArtist) return undefined;
    return (event: Readonly<{ points?: ReadonlyArray<{ pointNumber?: number }> }>) => {
      const pointNumber = event.points?.[0]?.pointNumber;
      if (pointNumber != null && topArtists[pointNumber]) {
        onSelectArtist(topArtists[pointNumber].artist);
      }
    };
  }, [onSelectArtist, topArtists]);

  if (topArtists.length === 0) return null;

  const bgStyle = paperColor ? { backgroundColor: paperColor } : undefined;

  return (
    <div
      className="w-full min-w-0 flex-1 rounded-lg border border-border/40 overflow-hidden flex flex-col"
      style={{ ...bgStyle, minHeight: height }}
    >
      <Plot
        key={paperColor ?? "initial"}
        data={data}
        layout={layout}
        config={config}
        onClick={handleClick}
        style={{ width: "100%", minWidth: 0, height: `${height}px` }}
        useResizeHandler
      />
    </div>
  );
}
