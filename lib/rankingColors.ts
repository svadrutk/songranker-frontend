/**
 * Ranking color preset for any ranking visualization (waffle, charts, etc.).
 * Use RANKING_CSS_VARS in components that support CSS variables (e.g. style={{ color: 'var(--ranking-1)' }}).
 * Use RANKING_HEX when you need raw hex (e.g. Plotly, canvas, or external libs).
 * Shared palette: Spring Green → Deep Forest → teals/blues → purple → Sage Lavender.
 */
export const RANKING_HEX = [
  "#88E65C", // Spring Green – slightly softened
  "#1A5C3D", // Deep Forest – dark green base
  "#006B63", // Deep Sea Teal – anchor color
  "#57D1C1", // Aquamarine – brighter, greener turquoise
  "#2B9EA1", // Aegean Blue – blue reflecting green
  "#1A5E91", // Marine Cobalt – deep blue, green edge
  "#204A5E", // Midnight Teal – dark moody blue-green
  "#5F5685", // Grape Leaf – purple muddied with green
  "#827EAD", // Muted Amethyst – cool mossy slate violet
  "#CCD9D2", // Sage Lavender – pale silvery-green lavender
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
