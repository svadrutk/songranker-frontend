"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { LeaderboardSong } from "@/lib/api";

const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
);

const TOP_N = 20;
const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

type TopAlbumsBubbleChartProps = Readonly<{
  songs: LeaderboardSong[];
}>;

function getThemeColors() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { paper: "#1a1a1a", font: "#e5e5e5", bubble: "oklch(0.5 0.15 264)" };
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return {
    paper: style.getPropertyValue("--card").trim() || "oklch(0.205 0 0)",
    font: style.getPropertyValue("--card-foreground").trim() || "oklch(0.985 0 0)",
    bubble: style.getPropertyValue("--chart-1").trim() || "oklch(0.488 0.243 264.376)",
  };
}

export function TopAlbumsBubbleChart({ songs }: TopAlbumsBubbleChartProps) {
  const colors = useMemo(() => getThemeColors(), []);

  const { bubbleData, annotations } = useMemo(() => {
    const top20 = songs.slice(0, TOP_N);
    if (top20.length === 0) return { bubbleData: null, annotations: [] };

    // Group by album (album name or "Unknown")
    const byAlbum = new Map<string, LeaderboardSong[]>();
    for (const s of top20) {
      const key = s.album?.trim() || "Unknown";
      if (!byAlbum.has(key)) byAlbum.set(key, []);
      byAlbum.get(key)!.push(s);
    }

    // Sort albums by count desc, then build x, y, size, text
    const entries = Array.from(byAlbum.entries())
      .map(([album, list]) => ({ album, count: list.length, songs: list }))
      .sort((a, b) => b.count - a.count);

    const x: number[] = [];
    const y: number[] = [];
    const sizes: number[] = [];
    const texts: string[] = [];
    const albumToIndex = new Map<string, number>();

    entries.forEach((e, i) => {
      albumToIndex.set(e.album, i);
      x.push(i);
      y.push(e.count);
      sizes.push(Math.max(20, e.count * 55));
      texts.push(`${e.album}<br>${e.count} song${e.count !== 1 ? "s" : ""}`);
    });

    // Rank 1, 2, 3 songs -> album + name for annotations (gold, silver, bronze)
    const rankSongs = [
      top20.find((s) => s.rank === 1),
      top20.find((s) => s.rank === 2),
      top20.find((s) => s.rank === 3),
    ];
    const medalColors = [GOLD, SILVER, BRONZE];
    const annotationsList: Array<{
      x: number;
      y: number;
      text: string;
      showarrow: boolean;
      font: { size: number; color: string; family: string };
      xanchor: string;
      yanchor: string;
    }> = [];

    rankSongs.forEach((song, idx) => {
      if (!song) return;
      const albumKey = song.album?.trim() || "Unknown";
      const i = albumToIndex.get(albumKey);
      if (i === undefined) return;
      const xi = x[i];
      const yi = y[i];
      annotationsList.push({
        x: xi,
        y: yi + 0.5,
        text: song.name,
        showarrow: false,
        font: { size: 11, color: medalColors[idx], family: "var(--font-geist-sans), sans-serif" },
        xanchor: "center",
        yanchor: "bottom",
      });
    });

    return {
      bubbleData: { x, y, sizes, texts, n: entries.length },
      annotations: annotationsList,
    };
  }, [songs]);

  const data = useMemo(() => {
    if (!bubbleData) return [];
    const { x, y, sizes, texts } = bubbleData;
    return [
      {
        type: "scatter" as const,
        x,
        y,
        mode: "markers+text" as const,
        marker: {
          size: sizes,
          color: colors.bubble,
          opacity: 0.85,
          line: { width: 1, color: colors.font },
        },
        text: bubbleData.n <= 12 ? bubbleData.texts.map((t) => t.split("<br>")[0]) : [],
        textposition: "top center" as const,
        textfont: { size: 10, color: colors.font },
        hovertemplate: "%{hovertext}<extra></extra>",
        hovertext: texts,
      },
    ];
  }, [bubbleData, colors.bubble, colors.font]);

  const layout = useMemo(
    () => ({
      title: { text: "Top 20 by album", font: { size: 14 } },
      xaxis: {
        visible: false,
        range: bubbleData ? [-0.6, bubbleData.n - 1 + 0.6] : [0, 1],
      },
      yaxis: {
        title: "Songs in top 20",
        dtick: 1,
        range: bubbleData ? [0, Math.max(5, Math.max(...bubbleData.y) + 1.2)] : [0, 5],
      },
      height: 320,
      margin: { t: 40, r: 20, b: 40, l: 50 },
      paper_bgcolor: colors.paper,
      plot_bgcolor: "transparent",
      font: { color: colors.font, family: "var(--font-geist-sans), sans-serif" },
      showlegend: false,
      annotations: annotations,
    }),
    [bubbleData, annotations, colors.paper, colors.font]
  );

  const config = useMemo(
    () => ({
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"] as const,
    }),
    []
  );

  if (!songs.length || !bubbleData) return null;

  return (
    <div className="w-full min-h-[320px] rounded-lg border border-border/40 bg-card overflow-hidden">
      <Plot
        data={data}
        layout={layout}
        config={config}
        style={{ width: "100%", height: "320px" }}
        useResizeHandler
      />
    </div>
  );
}
