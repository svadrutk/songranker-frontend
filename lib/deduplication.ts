/**
 * Utility for normalizing song titles and identifying potential duplicates.
 */

const SUFFIXES_REGEX = new RegExp(
  [
    "\\(instrumental\\)",
    "\\(a capella\\)",
    "\\(acapella\\)",
    "\\(live.*\\)",
    "\\(demo.*\\)",
    "\\(remastered.*\\)",
    "\\[remastered.*\\]",
    "\\(edit.*\\)",
    "\\(version.*\\)",
    "\\(feat\\..*\\)",
    "\\(with.*\\)",
    "- instrumental",
    "- live",
    "- demo",
    "- remastered",
    "- [0-9]{4} remaster",
    "\\([0-9]{4} remaster\\)",
  ].join("|"),
  "gi"
);

/**
 * Checks if a track should be excluded from ranking (e.g., instrumentals, a capella).
 */
export function isExcludedTrack(title: string): boolean {
  const exclusionPatterns = /\b(instrumental|acapella|a capella|a cappella)\b|[\(\[].*(instrumental|acapella|a capella|a cappella).*[\)\]]|- instrumental/i;
  return exclusionPatterns.test(title);
}

/**
 * Filters a list of tracks to remove excluded types.
 */
export function filterTracks(tracks: string[]): string[] {
  return tracks.filter(track => !isExcludedTrack(track));
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
  if (a.length < b.length) [a, b] = [b, a];
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    prevRow = currentRow;
  }

  return prevRow[b.length];
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

export interface DuplicateGroup {
  canonical: string;
  matches: string[];
  matchIndices: number[];
  confidence: number;
}

/**
 * Identifies potential duplicates in a list of songs.
 * Returns groups of songs that are likely the same.
 */
export function findPotentialDuplicates(songs: string[]): DuplicateGroup[] {
  const normalizedMap = new Map<string, number[]>();
  const groups: DuplicateGroup[] = [];
  const processed = new Set<number>();

  // First pass: Exact matches after normalization
  for (let i = 0; i < songs.length; i++) {
    const norm = normalizeTitle(songs[i]);
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, []);
    }
    normalizedMap.get(norm)!.push(i);
  }

  // Second pass: Group items that normalized to the same string
  for (const [, indices] of normalizedMap.entries()) {
    if (indices.length > 1) {
      groups.push({
        canonical: songs[indices[0]],
        matches: indices.map(idx => songs[idx]),
        matchIndices: indices,
        confidence: 100,
      });
      indices.forEach(idx => processed.add(idx));
    }
  }

  // Third pass: Fuzzy matching for remaining items
  const remainingIndices = songs.map((_, i) => i).filter(i => !processed.has(i));
  
  for (let i = 0; i < remainingIndices.length; i++) {
    const idxA = remainingIndices[i];
    if (processed.has(idxA)) continue;
    
    const currentMatchIndices: number[] = [idxA];
    let maxSimilarity = 0;

    for (let j = i + 1; j < remainingIndices.length; j++) {
      const idxB = remainingIndices[j];
      if (processed.has(idxB)) continue;

      const similarity = calculateSimilarity(
        normalizeTitle(songs[idxA]),
        normalizeTitle(songs[idxB])
      );

      if (similarity > 85) {
        currentMatchIndices.push(idxB);
        processed.add(idxB);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (currentMatchIndices.length > 1) {
      groups.push({
        canonical: songs[idxA],
        matches: currentMatchIndices.map(idx => songs[idx]),
        matchIndices: currentMatchIndices,
        confidence: maxSimilarity,
      });
      processed.add(idxA);
    }
  }

  return groups;
}
