"use client";

import { useTheme } from "next-themes";
import { useMemo, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ArtistWithLeaderboard } from "@/lib/api";
import { RANKING_HEX } from "@/lib/rankingColors";
import { cn } from "@/lib/utils";

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
const SILVER_DARK = "#E8E8E8";
const SILVER_LIGHT = "#9CA3AF"; // Darker silver for light mode visibility
const BRONZE = "#CD7F32";

/** Standard competition ranking: ties get same rank, next rank = 1 + count of people strictly ahead. */
function computeRanks(counts: number[]): number[] {
  return counts.map((count) => {
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

function outlineColorForRank(rank: number, isDark: boolean): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return isDark ? SILVER_DARK : SILVER_LIGHT;
  if (rank === 3) return BRONZE;
  return isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.4)";
}

type ComparisonsPerArtistChartProps = Readonly<{
  artists: ArtistWithLeaderboard[];
  onSelectArtist?: (artist: string) => void;
  /** When set (e.g. navigator closed), chart uses this height for taller bars. */
  height?: number;
}>;

function getThemeColors(isDark: boolean) {
  // Use explicit colors based on theme to avoid CSS variable timing issues
  return {
    font: isDark ? "#fafafa" : "#0a0a0a",
    fontMuted: isDark ? "rgba(250, 250, 250, 0.5)" : "rgba(10, 10, 10, 0.5)",
    grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    // Tooltip colors - consistent look in both themes
    tooltip: {
      bg: isDark 
        ? "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(25, 25, 35, 0.95))"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 250, 0.95))",
      border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      shadow: isDark ? "0 12px 40px rgba(0, 0, 0, 0.6)" : "0 12px 40px rgba(0, 0, 0, 0.15)",
      text: isDark ? "#fff" : "#000",
      textMuted: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
      textFaint: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.45)",
      divider: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
    },
    // Hover states
    hover: {
      scale: 1.02,
      brightness: 1.2,
      translateX: 6,
    },
  };
}

const DEFAULT_CHART_HEIGHT = 480;

export function ComparisonsPerArtistChart({
  artists,
  onSelectArtist,
  height = DEFAULT_CHART_HEIGHT,
}: ComparisonsPerArtistChartProps) {
  const { resolvedTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track mount state and handle resizing
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || height
        });
      }
    };
    
    handleResize();
    
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [height, mounted]);

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

  useEffect(() => {
    // Wait for mount and theme to be resolved before rendering
    if (!mounted || !resolvedTheme) return;
    if (!svgRef.current || !containerRef.current || topArtists.length === 0) return;

    const isDark = resolvedTheme === "dark";
    const colors = getThemeColors(isDark);
    const container = containerRef.current;
    
    // Get container dimensions
    const containerWidth = dimensions.width || container.clientWidth;
    // Use the larger of the two to fill the space
    const containerHeight = dimensions.height || height;

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);
    
    svg.selectAll("*").remove();

    // Margins: left for artist names, right for badges, bottom for x-axis
    const margin = { top: 60, right: 90, bottom: 65, left: 160 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;

    // Add subtle grain texture and other filters
    const defs = svg.append("defs");
    
    // Noise filter for grain texture
    const filter = defs.append("filter")
      .attr("id", "grain")
      .attr("x", "0%")
      .attr("y", "0%")
      .attr("width", "100%")
      .attr("height", "100%");
    
    filter.append("feTurbulence")
      .attr("type", "fractalNoise")
      .attr("baseFrequency", "0.95")
      .attr("numOctaves", "3")
      .attr("result", "noise");
    
    filter.append("feColorMatrix")
      .attr("in", "noise")
      .attr("type", "saturate")
      .attr("values", "0")
      .attr("result", "desaturatedNoise");
    
    filter.append("feComponentTransfer")
      .attr("in", "desaturatedNoise")
      .attr("result", "theNoise")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", "0.035");
    
    filter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "theNoise")
      .attr("mode", "multiply");

    // Gradients for bars (horizontal: left to right with subtle vertical variation)
    topArtists.forEach((_, i) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `bar-gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      
      const baseColor = shuffledColors[i % shuffledColors.length];
      const darkerColor = d3.color(baseColor)?.darker(0.3).formatHex() ?? baseColor;
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", darkerColor)
        .attr("stop-opacity", "0.9");
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", baseColor)
        .attr("stop-opacity", "1");
    });

    // Top shine gradient
    const shineGradient = defs.append("linearGradient")
      .attr("id", "bar-shine")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    shineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "white")
      .attr("stop-opacity", isDark ? "0.1" : "0.2");
    
    shineGradient.append("stop")
      .attr("offset", "30%")
      .attr("stop-color", "white")
      .attr("stop-opacity", "0");

    // Glow filters for top ranks
    [1, 2, 3].forEach((rank) => {
      const glowFilter = defs.append("filter")
        .attr("id", `glow-${rank}`)
        .attr("x", "-40%")
        .attr("y", "-40%")
        .attr("width", "180%")
        .attr("height", "180%");
      
      glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", rank === 1 ? "8" : rank === 2 ? "6" : "4")
        .attr("result", "coloredBlur");
      
      glowFilter.append("feFlood")
        .attr("flood-color", outlineColorForRank(rank, isDark))
        .attr("flood-opacity", isDark ? "0.5" : "0.3")
        .attr("result", "glowColor");
        
      glowFilter.append("feComposite")
        .attr("in", "glowColor")
        .attr("in2", "coloredBlur")
        .attr("operator", "in")
        .attr("result", "softGlow");
      
      const feMerge = glowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "softGlow");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title group
    const titleG = svg.append("g")
      .attr("transform", `translate(${containerWidth / 2}, 45)`);

    titleG.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "900")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.font)
      .style("letter-spacing", "-0.02em")
      .text("Top 10 Performers");

    // Create scales - HORIZONTAL bars
    const yScale = d3
      .scaleBand()
      .domain(topArtists.map((a) => a.artist))
      .range([0, chartHeight])
      .padding(0.3);

    const maxX = Math.max(...topArtists.map((a) => a.total_comparisons), 1);
    const xScale = d3
      .scaleLinear()
      .domain([0, maxX + 0.5]) // Extra padding for visual clarity
      .range([0, chartWidth]);

    // Add vertical grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(0, maxX + 2, 1))
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", -10)
      .attr("y2", chartHeight + 10)
      .style("stroke", colors.grid)
      .style("stroke-width", "1px");

    // Add Y axis (artist names on left)
    const yAxis = g.append("g").call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select(".domain").remove();
    yAxis.selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "800")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.font)
      .attr("dx", "-15");

    // Add X axis (bottom)
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${chartHeight + 15})`)
      .call(d3.axisBottom(xScale).ticks(maxX).tickSize(0));
    
    xAxis.select(".domain").remove();
    xAxis.selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-geist-mono), monospace")
      .style("fill", colors.fontMuted)
      .attr("dy", "15");

    // X axis label
    g.append("text")
      .attr("x", (containerWidth / 2) - margin.left)
      .attr("y", chartHeight + 55)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.fontMuted)
      .style("text-transform", "uppercase")
      .style("letter-spacing", "0.1em")
      .text("Unique Contributors");

    const isDesktop = containerWidth > 768;
    const animDuration = 800;
    const animDelay = 50;

    // Create bar containers
    const barGroups = g.selectAll(".bar-group")
      .data(topArtists)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(0, ${yScale(d.artist) ?? 0})`)
      .style("cursor", onSelectArtist ? "pointer" : "default")
      .on("click", (event, d) => onSelectArtist?.(d.artist));

    // Shadow rects
    barGroups.append("rect")
      .attr("class", "bar-shadow")
      .attr("x", 4)
      .attr("y", 4)
      .attr("width", isDesktop ? 0 : (d) => xScale(d.total_comparisons))
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", "black")
      .attr("fill-opacity", 0.15);

    // Main bars
    barGroups.append("rect")
      .attr("class", "bar-rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", isDesktop ? 0 : (d) => xScale(d.total_comparisons))
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", (_, i) => `url(#bar-gradient-${i})`)
      .attr("stroke", (_, i) => outlineColorForRank(topRanks[i], isDark))
      .attr("stroke-width", (_, i) => topRanks[i] <= 3 ? 2 : 1)
      .attr("filter", (_, i) => topRanks[i] <= 3 ? `url(#glow-${topRanks[i]})` : "none");

    // Shine overlay
    barGroups.append("rect")
      .attr("class", "bar-shine")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", isDesktop ? 0 : (d) => xScale(d.total_comparisons))
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("fill", "url(#bar-shine)")
      .style("pointer-events", "none");

    // Animation logic
    if (isDesktop) {
      g.selectAll(".bar-shadow, .bar-rect, .bar-shine")
        .transition()
        .duration(animDuration)
        .delay((_, i) => (i % topArtists.length) * animDelay)
        .ease(d3.easeElasticOut.amplitude(0.6).period(0.8))
        .attr("width", (d) => xScale((d as ArtistWithLeaderboard).total_comparisons));
    }

    // Badge groups
    const badges = barGroups.append("g")
      .attr("class", "badge-group")
      .attr("transform", (d) => `translate(${isDesktop ? 0 : xScale(d.total_comparisons) + 20}, ${yScale.bandwidth() / 2})`)
      .style("opacity", isDesktop ? 0 : 1);

    if (isDesktop) {
      badges.transition()
        .duration(animDuration)
        .delay((_, i) => i * animDelay + 300)
        .ease(d3.easeElasticOut)
        .attr("transform", (d) => `translate(${xScale(d.total_comparisons) + 25}, ${yScale.bandwidth() / 2})`)
        .style("opacity", 1);
    }

    badges.append("rect")
      .attr("x", -12)
      .attr("y", -12)
      .attr("width", 24)
      .attr("height", 24)
      .attr("rx", 12)
      .attr("fill", (_, i) => outlineColorForRank(topRanks[i], isDark))
      .attr("stroke", isDark ? "white" : "black")
      .attr("stroke-width", 1.5)
      .attr("filter", (_, i) => topRanks[i] <= 3 ? `url(#glow-${topRanks[i]})` : "none");

    badges.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.38em")
      .style("font-size", (_, i) => topRanks[i] <= 3 ? "12px" : "10px")
      .style("font-weight", "900")
      .style("font-family", "var(--font-geist-mono), monospace")
      .style("fill", (_, i) => topRanks[i] <= 3 ? "#000" : (isDark ? "#fff" : "#000"))
      .text((_, i) => topRanks[i]);

    // Theme-aware tooltip
    const tooltip = d3.select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", colors.tooltip.bg)
      .style("border", `1px solid ${colors.tooltip.border}`)
      .style("border-radius", "10px")
      .style("padding", "14px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("box-shadow", colors.tooltip.shadow)
      .style("backdrop-filter", "blur(12px)")
      .style("transition", "opacity 0.2s ease, transform 0.2s ease")
      .style("transform", "translateY(5px)");

    barGroups
      .on("mouseenter", function(event, d) {
        const index = topArtists.indexOf(d);
        const rankColor = outlineColorForRank(topRanks[index], isDark);
        
        tooltip
          .style("opacity", 1)
          .style("transform", "translateY(0)")
          .html(`
            <div style="font-family: var(--font-geist-mono); font-size: 10px; font-weight: 800; color: ${rankColor}; margin-bottom: 4px; letter-spacing: 0.1em; text-transform: uppercase;">
              RANK #${topRanks[index]}
            </div>
            <div style="font-family: var(--font-geist-sans); font-size: 16px; font-weight: 800; color: ${colors.tooltip.text}; margin-bottom: 8px;">
              ${d.artist}
            </div>
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span style="font-family: var(--font-geist-mono); font-size: 20px; font-weight: 900; color: ${colors.tooltip.text};">${d.total_comparisons}</span>
              <span style="font-family: var(--font-geist-sans); font-size: 11px; font-weight: 600; color: ${colors.tooltip.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;">Contributors</span>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.offsetX + 20}px`)
          .style("top", `${event.offsetY - 40}px`);
      })
      .on("mouseleave", function() {
        tooltip.style("opacity", 0).style("transform", "translateY(5px)");
      });

    return () => { tooltip.remove(); };
  }, [mounted, topArtists, topRanks, shuffledColors, height, onSelectArtist, resolvedTheme, dimensions.width, dimensions.height]);

  if (topArtists.length === 0) return null;

  // Mobile: Render a clean list-based layout (ignore height prop, show all items)
  if (isMobile) {
    const maxComparisons = Math.max(...topArtists.map(a => a.total_comparisons), 1);
    
    return (
      <div className="w-full rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-5 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col items-center text-center gap-1">
            <h3 className="text-xl font-black text-foreground tracking-tight">Top 10 Performers</h3>
            <p className="text-[10px] font-black text-primary/80 font-mono uppercase tracking-widest">
              By Contributors
            </p>
          </div>
        </div>
        
        {/* List */}
        <div className="divide-y divide-border/20">
          {topArtists.map((artist, index) => {
            const rank = topRanks[index];
            const isTopThree = rank <= 3;
            const percentage = (artist.total_comparisons / maxComparisons) * 100;
            const barColor = shuffledColors[index % shuffledColors.length];
            const rankColor = outlineColorForRank(rank, resolvedTheme === "dark");
            
            return (
              <button
                key={artist.artist}
                onClick={() => onSelectArtist?.(artist.artist)}
                className={cn(
                  "w-full px-5 py-4 flex flex-col gap-3 transition-all",
                  "hover:bg-muted/30 active:bg-muted/50 text-left",
                  onSelectArtist && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-sm relative",
                      isTopThree && "shadow-lg shadow-black/10"
                    )}
                    style={{ 
                      backgroundColor: rankColor,
                      color: isTopThree ? "#000" : (resolvedTheme === "dark" ? "#fff" : "#000"),
                      border: `1.5px solid ${resolvedTheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`
                    }}
                  >
                    {rank}
                  </div>
                  
                  {/* Artist Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-base text-foreground truncate tracking-tight">
                        {artist.artist}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black font-mono text-foreground/90">
                          {artist.total_comparisons}
                        </span>
                        <span className="text-[8px] font-bold font-mono text-muted-foreground/60 uppercase tracking-tighter">
                          CONTRIB
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="relative h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      {/* Grid markers inside bar */}
                      <div className="absolute inset-0 flex justify-between px-2 opacity-20 pointer-events-none">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-[1px] h-full bg-foreground/20" />)}
                      </div>
                      
                      {/* Actual Progress */}
                      <div
                        className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: barColor,
                        }}
                      >
                        {/* Shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: Render D3 chart
  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 flex-1 rounded-lg border border-border/40 overflow-hidden flex flex-col relative"
      style={{ 
        position: "relative",
        background: "linear-gradient(135deg, transparent 0%, rgba(var(--primary-rgb, 0, 0, 0), 0.02) 100%)"
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full min-h-0"
        style={{
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
