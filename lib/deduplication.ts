import { type ReleaseGroup, type SongInput } from "./api";
import { type RankingSource } from "./stores/session-builder-store";

/**
 * Utility for normalizing song titles and identifying potential duplicates.
 */

const SUFFIXES_REGEX = new RegExp(
  [
    // Parenthetical or bracketed suffixes
    "\\s*[\\(\\[](instrumental|acapella|a capp?ella|live|demo|remastered|edit|version|feat\\.|with|remix|extended|acoustic|[0-9]{4}\\s*remaster).*?[\\)\\]]",
    // Hyphenated suffixes
    "\\s*-\\s*(instrumental|live|demo|remastered|extended|remix|acoustic|edit|radio\\s*edit|[0-9]{4}\\s*remaster).*",
  ].join("|"),
  "gi"
);

/**
 * Checks if a track should be excluded from ranking (e.g., instrumentals, a capella).
 */
export function isExcludedTrack(title: string): boolean {
  const exclusionPatterns =
    /\b(instrumental|acapella|a capella|a cappella)\b|[\(\[].*(instrumental|acapella|a capella|a cappella).*[\)\]]|- instrumental/i;
  return exclusionPatterns.test(title);
}

/**
 * Filters a list of tracks to remove excluded types.
 */
export function filterTracks(tracks: readonly string[]): string[] {
  return tracks.filter((track) => !isExcludedTrack(track));
}

/**
 * Cleans a song title by removing common suffixes and extra whitespace.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(SUFFIXES_REGEX, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates the Levenshtein distance between two strings with O(N) memory complexity.
 */
function levenshteinDistance(a: string, b: string): number {
  let str1 = a;
  let str2 = b;
  if (str1.length < str2.length) [str1, str2] = [str2, str1];
  if (str2.length === 0) return str1.length;

  let prevRow = Array.from({ length: str2.length + 1 }, (_, i) => i);

  for (let i = 1; i <= str1.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(currentRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    prevRow = currentRow;
  }

  return prevRow[str2.length];
}

/**
 * Calculates a similarity score between 0 and 100.
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 100;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  // Optimization: If length difference is too large, it can't be a high match
  const maxLength = Math.max(len1, len2);
  const minLength = Math.min(len1, len2);
  if (minLength / maxLength < 0.7) return 0;

  const distance = levenshteinDistance(s1, s2);
  return Math.floor(((maxLength - distance) / maxLength) * 100);
}

export type DuplicateGroup = {
  canonical: string;
  matches: string[];
  matchIndices: number[];
  confidence: number;
};

/**
 * Identifies potential duplicates in a list of songs.
 * Returns groups of songs that are likely the same.
 */
export function findPotentialDuplicates(songs: readonly string[]): DuplicateGroup[] {
  const normalizedMap = new Map<string, number[]>();
  const groups: DuplicateGroup[] = [];
  const processed = new Set<number>();

  // First pass: Exact matches after normalization
  for (let i = 0; i < songs.length; i++) {
    const norm = normalizeTitle(songs[i]);
    const indices = normalizedMap.get(norm) ?? [];
    indices.push(i);
    normalizedMap.set(norm, indices);
  }

  // Second pass: Group items that normalized to the same string
  for (const indices of normalizedMap.values()) {
    if (indices.length > 1) {
      groups.push({
        canonical: songs[indices[0]],
        matches: indices.map((idx) => songs[idx]),
        matchIndices: indices,
        confidence: 100,
      });
      indices.forEach((idx) => processed.add(idx));
    }
  }

  // Third pass: Fuzzy matching for remaining items
  const remainingIndices = songs.map((_, i) => i).filter((i) => !processed.has(i));

  for (let i = 0; i < remainingIndices.length; i++) {
    const idxA = remainingIndices[i];
    if (processed.has(idxA)) continue;

    const currentMatchIndices: number[] = [idxA];
    let maxSimilarity = 0;

    for (let j = i + 1; j < remainingIndices.length; j++) {
      const idxB = remainingIndices[j];
      if (processed.has(idxB)) continue;

      const similarity = calculateSimilarity(normalizeTitle(songs[idxA]), normalizeTitle(songs[idxB]));

      if (similarity > 85) {
        currentMatchIndices.push(idxB);
        processed.add(idxB);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (currentMatchIndices.length > 1) {
      groups.push({
        canonical: songs[idxA],
        matches: currentMatchIndices.map((idx) => songs[idx]),
        matchIndices: currentMatchIndices,
        confidence: maxSimilarity,
      });
      processed.add(idxA);
    }
  }

  return groups;
}

/**
 * Resolves all tracks from a list of sources into a flat list of SongInput objects.
 */
export function resolveSourcesToSongs(sources: readonly RankingSource[]): SongInput[] {
  const allSongs: SongInput[] = [];
  for (const source of sources) {
    if (source.resolvedTracks) {
      allSongs.push(...source.resolvedTracks);
    }
  }
  return allSongs;
}

/**
 * Maps raw song names to SongInput objects, deduplicating by normalized title and artist.
 * Prefers the shortest name as the canonical version.
 */
export function prepareSongInputs(
  songs: readonly string[],
  selectedReleases: readonly ReleaseGroup[],
  allTracks: Readonly<Record<string, string[]>>
): SongInput[] {
  const songInputsMap = new Map<string, SongInput>();

  for (const name of songs) {
    const release = selectedReleases.find((r) => allTracks[r.id]?.includes(name));
    const artist = release?.artist || "Unknown Artist";
    const normalized = normalizeTitle(name);
    const key = `${normalized}|${artist.toLowerCase().trim()}`;

    const existing = songInputsMap.get(key);
    // If we haven't seen this song, or if the current name is shorter (more canonical)
    if (!existing || name.length < existing.name.length) {
      // Generate a fallback URL if cover_art.url is missing but we have a release ID
      const coverUrl =
        release?.cover_art?.url ||
        (release?.id ? `https://coverartarchive.org/release-group/${release.id}/front-250` : null);

      songInputsMap.set(key, {
        name,
        artist,
        album: release?.title || null,
        cover_url: coverUrl,
        spotify_id: null, // Backend handles resolution, but we can pass null
      });
    }
  }

  return Array.from(songInputsMap.values());
}
