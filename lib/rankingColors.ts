/**
 * Ranking color preset for any ranking visualization (waffle, charts, etc.).
 * Use RANKING_CSS_VARS in components that support CSS variables (e.g. style={{ color: 'var(--ranking-1)' }}).
 * Use RANKING_HEX when you need raw hex (e.g. Plotly, canvas, or external libs).
 */
export const RANKING_HEX = [
  "#FF0000", // Red
  "#FF8C00", // Dark Orange
  "#FFD700", // Goldenrod (Yellow)
  "#008000", // Forest Green
  "#0000FF", // Classic Blue
  "#4B0082", // Indigo
  "#EE82EE", // Violet
  "#00FFFF", // Cyan (Electric Blue)
  "#FF69B4", // Hot Pink
  "#7FFF00", // Chartreuse (Neon Lime)
] as const;

export const RANKING_CSS_VARS = [
  "var(--ranking-1)",
  "var(--ranking-2)",
  "var(--ranking-3)",
  "var(--ranking-4)",
  "var(--ranking-5)",
  "var(--ranking-6)",
  "var(--ranking-7)",
  "var(--ranking-8)",
  "var(--ranking-9)",
  "var(--ranking-10)",
] as const;
