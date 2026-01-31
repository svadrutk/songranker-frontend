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
    bar: isDark ? "oklch(0.646 0.222 41.116)" : "oklch(0.488 0.243 264.376)",
    // Tooltip colors - consistent look in both themes
    tooltip: {
      bg: isDark 
        ? "linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 30, 45, 0.98))"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
      border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      shadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "0 8px 32px rgba(0, 0, 0, 0.15)",
      text: isDark ? "#fff" : "#0a0a0a",
      textMuted: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
      textFaint: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.45)",
      divider: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    },
    // Hover states
    hover: {
      strokeMultiplier: 1.4, // Increase stroke width by this factor on hover
      translateX: 4,        // Pixels to shift bar on hover
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
    setMounted(true);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(containerRef.current.clientHeight, height)
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
  }, [height]);

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
    const margin = { top: 40, right: 80, bottom: 45, left: 150 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;

    // Add subtle grain texture as SVG filter
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
      .attr("baseFrequency", "0.9")
      .attr("numOctaves", "4")
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
      .attr("slope", "0.05");
    
    filter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "theNoise")
      .attr("mode", "multiply");

    // Gradient for bars (horizontal: left to right)
    topArtists.forEach((_, i) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `bar-gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      
      const baseColor = shuffledColors[i % shuffledColors.length];
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", baseColor)
        .attr("stop-opacity", "0.85");
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", baseColor)
        .attr("stop-opacity", "1");
    });

    // Glow filters for top 3
    [1, 2, 3].forEach((rank) => {
      const glowFilter = defs.append("filter")
        .attr("id", `glow-${rank}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", rank === 1 ? "6" : rank === 2 ? "4" : "3")
        .attr("result", "coloredBlur");
      
      const feMerge = glowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
      .attr("x", containerWidth / 2)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.font)
      .style("letter-spacing", "0.02em")
      .text("Top 10 Artists");

    // Create scales - HORIZONTAL bars
    // Y-axis: artists (band scale)
    const yScale = d3
      .scaleBand()
      .domain(topArtists.map((a) => a.artist))
      .range([0, chartHeight])
      .padding(0.2);

    // X-axis: contributors (linear scale)
    const maxX = Math.max(...topArtists.map((a) => a.total_comparisons), 1);
    const xScale = d3
      .scaleLinear()
      .domain([0, maxX + 1])
      .range([0, chartWidth]);

    // Add vertical grid lines (subtle)
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(0, maxX + 2, 1))
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("stroke", colors.font)
      .style("stroke-opacity", "0.05")
      .style("stroke-width", "1px");

    // Add Y axis (artist names on left)
    const yAxis = g.append("g").call(
      d3.axisLeft(yScale).tickSize(0)
    );

    yAxis.select(".domain").remove();

    yAxis
      .selectAll("text")
      .style("font-size", "15px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.font)
      .attr("dx", "-8");

    // Add X axis (contributors on bottom)
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(maxX)
          .tickFormat(d3.format("d"))
      );

    xAxis.select(".domain")
      .style("stroke", colors.font)
      .style("stroke-opacity", "0.2");
    
    xAxis
      .selectAll("line")
      .style("stroke", colors.font)
      .style("stroke-opacity", "0.1");

    xAxis
      .selectAll("text")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("font-family", "var(--font-geist-mono), monospace")
      .style("fill", colors.font);

    // Add X axis label
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "700")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("fill", colors.font)
      .style("opacity", "0.8")
      .style("text-transform", "uppercase")
      .style("letter-spacing", "0.1em")
      .text("Contributors");

    // Check if desktop for animations (width > 768px)
    const isDesktop = containerWidth > 768;
    const animDuration = 400;
    const animDelay = 60;

    // Create shadow for bars
    const shadowGroup = g.append("g").attr("class", "shadows");

    const shadows = shadowGroup
      .selectAll(".shadow")
      .data(topArtists)
      .enter()
      .append("rect")
      .attr("class", "shadow")
      .attr("x", 3)
      .attr("y", (d) => (yScale(d.artist) ?? 0) + 3)
      .attr("width", isDesktop ? 0 : (d) => xScale(d.total_comparisons))
      .attr("height", yScale.bandwidth())
      .attr("rx", 3)
      .attr("fill", "rgba(0, 0, 0, 0.15)")
      .attr("filter", "url(#grain)");

    // Animate shadows on desktop
    if (isDesktop) {
      shadows
        .transition()
        .duration(animDuration)
        .delay((_, i) => i * animDelay)
        .ease(d3.easeQuadOut)
        .attr("width", (d) => xScale(d.total_comparisons));
    }

    // Create horizontal bars
    const bars = g
      .selectAll(".bar")
      .data(topArtists)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.artist) ?? 0)
      .attr("width", isDesktop ? 0 : (d) => xScale(d.total_comparisons))
      .attr("height", yScale.bandwidth())
      .attr("rx", 3)
      .attr("fill", (_, i) => `url(#bar-gradient-${i})`)
      .attr("stroke", (_, i) => outlineColorForRank(topRanks[i], isDark))
      .attr("stroke-width", (_, i) => topRanks[i] <= 3 ? 2.5 : 1)
      .attr("filter", (_, i) => topRanks[i] <= 3 ? `url(#glow-${topRanks[i]})` : "url(#grain)")
      .style("cursor", onSelectArtist ? "pointer" : "default")
      .on("click", (event, d) => {
        if (onSelectArtist) {
          onSelectArtist(d.artist);
        }
      });

    // Animate bars on desktop (top to bottom stagger)
    if (isDesktop) {
      bars
        .transition()
        .duration(animDuration)
        .delay((_, i) => i * animDelay)
        .ease(d3.easeQuadOut)
        .attr("width", (d) => xScale(d.total_comparisons));
    }

    // Add rank badges at the end of bars
    const badgeGroups = g
      .selectAll(".badge")
      .data(topArtists)
      .enter()
      .append("g")
      .attr("class", "badge")
      .attr("transform", (d) => {
        const barEnd = isDesktop ? 0 : xScale(d.total_comparisons);
        const yPos = (yScale(d.artist) ?? 0) + yScale.bandwidth() / 2;
        return `translate(${barEnd + 20}, ${yPos})`;
      })
      .style("opacity", isDesktop ? 0 : 1);

    // Animate badges on desktop
    if (isDesktop) {
      badgeGroups
        .transition()
        .duration(animDuration)
        .delay((_, i) => i * animDelay + 100)
        .ease(d3.easeQuadOut)
        .attr("transform", (d) => {
          const barEnd = xScale(d.total_comparisons);
          const yPos = (yScale(d.artist) ?? 0) + yScale.bandwidth() / 2;
          return `translate(${barEnd + 20}, ${yPos})`;
        })
        .style("opacity", 1);
    }

    // Badge circle
    badgeGroups
      .append("circle")
      .attr("r", (_, i) => topRanks[i] <= 3 ? 14 : 11)
      .attr("fill", (_, i) => outlineColorForRank(topRanks[i], isDark))
      .attr("stroke", isDark ? "white" : "rgba(0, 0, 0, 0.2)")
      .attr("stroke-width", 1.5)
      .attr("filter", (_, i) => topRanks[i] <= 3 ? `url(#glow-${topRanks[i]})` : "none");

    // Badge text - contrast against badge fill color
    badgeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", (_, i) => topRanks[i] <= 3 ? "11px" : "9px")
      .style("font-weight", "900")
      .style("font-family", "var(--font-geist-mono), monospace")
      .style("fill", (_, i) => {
        // Top 3 have bright backgrounds (gold/silver/bronze) - use black text
        if (topRanks[i] <= 3) return "#000";
        // Others: badge is semi-transparent so background shows through
        // Dark mode: dark bg shows through → use white text
        // Light mode: light bg shows through → use dark text
        return isDark ? "#fff" : "#000";
      })
      .text((_, i) => topRanks[i]);

    // Theme-aware tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", colors.tooltip.bg)
      .style("border", `2px solid ${colors.tooltip.border}`)
      .style("border-radius", "12px")
      .style("padding", "12px 16px")
      .style("font-family", "var(--font-geist-sans), sans-serif")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("box-shadow", colors.tooltip.shadow)
      .style("backdrop-filter", "blur(10px)")
      .style("transform", "translateY(-8px)");

    // Store base stroke widths for hover calculations
    const baseStrokeWidths = topArtists.map((_, i) => topRanks[i] <= 3 ? 2.5 : 1);

    bars
      .on("mouseenter", function(event, d) {
        const index = topArtists.indexOf(d);
        const baseStroke = baseStrokeWidths[index];
        
        // Bar hover animation - shift right and thicken stroke
        d3.select(this)
          .transition()
          .duration(150)
          .attr("transform", `translateX(${colors.hover.translateX}px)`)
          .attr("stroke-width", baseStroke * colors.hover.strokeMultiplier);
        
        // Show tooltip with theme-aware colors
        const contributorLabel = d.total_comparisons === 1 ? "1 Contributor" : `${d.total_comparisons} Contributors`;
        const rankColor = outlineColorForRank(topRanks[index], isDark);
        
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${rankColor}; box-shadow: 0 0 12px ${rankColor};"></div>
              <div style="font-size: 15px; font-weight: 700; color: ${colors.tooltip.text}; letter-spacing: 0.02em;">${d.artist}</div>
            </div>
            <div style="font-size: 12px; color: ${colors.tooltip.textMuted}; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">
              ${contributorLabel}
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${colors.tooltip.divider}; font-size: 11px; color: ${colors.tooltip.textFaint}; font-family: var(--font-geist-mono), monospace;">
              Rank #${topRanks[index]}
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 16}px`);
      })
      .on("mouseleave", function(event, d) {
        const index = topArtists.indexOf(d);
        const baseStroke = baseStrokeWidths[index];
        
        // Reset bar to original state
        d3.select(this)
          .transition()
          .duration(150)
          .attr("transform", "translateX(0)")
          .attr("stroke-width", baseStroke);
        
        // Hide tooltip
        tooltip.style("opacity", 0);
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [mounted, topArtists, topRanks, shuffledColors, height, onSelectArtist, resolvedTheme, dimensions.width, dimensions.height]);

  if (topArtists.length === 0) return null;

  // Mobile: Render a clean list-based layout (ignore height prop, show all items)
  if (isMobile) {
    const maxComparisons = Math.max(...topArtists.map(a => a.total_comparisons), 1);
    
    return (
      <div className="w-full rounded-lg border border-border/40 bg-card/50">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
          <h3 className="text-sm font-bold text-foreground">Top 10 Artists</h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
            By contributor count
          </p>
        </div>
        
        {/* List - all items visible */}
        <div>
          {topArtists.map((artist, index) => {
            const rank = topRanks[index];
            const isTopThree = rank <= 3;
            const percentage = (artist.total_comparisons / maxComparisons) * 100;
            const barColor = shuffledColors[index % shuffledColors.length];
            
            return (
              <button
                key={artist.artist}
                onClick={() => onSelectArtist?.(artist.artist)}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 transition-colors border-b border-border/30 last:border-b-0",
                  "hover:bg-muted/50 active:bg-muted/70",
                  onSelectArtist && "cursor-pointer"
                )}
              >
                {/* Rank Badge */}
                <div
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-sm",
                    isTopThree && "shadow-lg",
                    rank === 1 && "bg-[#FFD700] text-black",
                    rank === 2 && "bg-[#E8E8E8] text-black",
                    rank === 3 && "bg-[#CD7F32] text-white",
                    !isTopThree && "bg-muted text-muted-foreground"
                  )}
                >
                  {rank}
                </div>
                
                {/* Artist Info & Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {artist.artist}
                    </span>
                    <span className="shrink-0 text-xs font-mono text-muted-foreground">
                      {artist.total_comparisons}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isTopThree && "shadow-sm"
                      )}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                        boxShadow: isTopThree ? `0 0 8px ${barColor}40` : undefined
                      }}
                    />
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
        minHeight: height,
        position: "relative",
        background: "linear-gradient(135deg, transparent 0%, rgba(var(--primary-rgb, 0, 0, 0), 0.02) 100%)"
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
