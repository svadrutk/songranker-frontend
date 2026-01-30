"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ArtistWithLeaderboard } from "@/lib/api";

// Load Plot only on client to avoid SSR/window issues
const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
);

type ComparisonsPerArtistChartProps = Readonly<{
  artists: ArtistWithLeaderboard[];
  onSelectArtist?: (artist: string) => void;
}>;

function getThemeColors() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { paper: "#1a1a1a", font: "#e5e5e5", bar: "oklch(0.646 0.222 41.116)" };
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return {
    paper: style.getPropertyValue("--card").trim() || "oklch(0.205 0 0)",
    font: style.getPropertyValue("--card-foreground").trim() || "oklch(0.985 0 0)",
    bar: style.getPropertyValue("--chart-1").trim() || "oklch(0.488 0.243 264.376)",
  };
}

export function ComparisonsPerArtistChart({
  artists,
  onSelectArtist,
}: ComparisonsPerArtistChartProps) {
  const colors = useMemo(() => getThemeColors(), []);

  const data = useMemo(
    () => [
      {
        type: "bar" as const,
        x: artists.map((a) => a.artist),
        y: artists.map((a) => a.total_comparisons),
        marker: { color: colors.bar },
        hovertemplate: "%{x}<br>%{y:,} comparisons<extra></extra>",
      },
    ],
    [artists, colors.bar]
  );

  const layout = useMemo(
    () => ({
      title: { text: "Comparisons by artist", font: { size: 14 } },
      xaxis: {
        title: "Artist",
        tickangle: -45,
        tickfont: { size: 11 },
      },
      yaxis: { title: "Comparisons" },
      height: 280,
      autosize: true,
      margin: { t: 40, r: 20, b: 100, l: 60 },
      paper_bgcolor: colors.paper,
      plot_bgcolor: "transparent",
      font: { color: colors.font, family: "var(--font-geist-sans), sans-serif" },
      showlegend: false,
    }),
    [colors.paper, colors.font]
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

  const handleClick = useMemo(() => {
    if (!onSelectArtist) return undefined;
    return (event: Readonly<{ points?: ReadonlyArray<{ pointNumber?: number }> }>) => {
      const pointNumber = event.points?.[0]?.pointNumber;
      if (pointNumber != null && artists[pointNumber]) {
        onSelectArtist(artists[pointNumber].artist);
      }
    };
  }, [onSelectArtist, artists]);

  if (artists.length === 0) return null;

  return (
    <div className="w-full min-h-[280px] rounded-lg border border-border/40 bg-card overflow-hidden">
      <Plot
        data={data}
        layout={layout}
        config={config}
        onClick={handleClick}
        style={{ width: "100%", height: "280px" }}
        useResizeHandler
      />
    </div>
  );
}
