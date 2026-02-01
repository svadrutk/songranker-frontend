import { type SessionSong } from "./api";

/**
 * Helper: Get effective strength for sorting (prefers bt_strength, falls back to local_elo)
 */
function getStrength(song: SessionSong): number {
  if (song.bt_strength != null && song.bt_strength > 0) {
    return song.bt_strength;
  }
  // Normalize local_elo to roughly same scale as bt_strength
  return Math.max(0.01, Math.pow(10, (song.local_elo - 1500) / 400));
}

/**
 * Helper: Sort songs by strength (descending)
 */
function getSortedByStrength(songs: SessionSong[]): SessionSong[] {
  return [...songs].sort((a, b) => getStrength(b) - getStrength(a));
}

/**
 * Helper: Pick two different random songs from a list
 */
function pickTwoRandom(songs: SessionSong[]): [SessionSong, SessionSong] {
  const indexA = Math.floor(Math.random() * songs.length);
  let indexB = Math.floor(Math.random() * songs.length);
  while (indexB === indexA && songs.length > 1) {
    indexB = Math.floor(Math.random() * songs.length);
  }
  return [songs[indexA], songs[indexB]];
}

/**
 * Helper: Weighted random selection based on weights array
 * Higher weight = higher probability of selection
 */
function weightedRandomPick<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  // Fallback (shouldn't reach here)
  return items[items.length - 1];
}

/**
 * Helper: Find a diverse neighbor for songA
 * Expands the pool to 10 and ensures some tier diversity
 */
function findDiverseNeighbor(
  songs: SessionSong[],
  songA: SessionSong
): SessionSong {
  const candidates = songs
    .map((song) => {
      // Calculate strength difference
      const strengthA = getStrength(songA);
      const strengthB = getStrength(song);
      const diff = Math.abs(strengthB - strengthA) / Math.max(strengthA, strengthB, 0.01);
      
      // Factor in comparison count - prefer songs with fewer comparisons
      const uncertaintyBonus = 1 / ((song.comparison_count ?? 0) + 1);
      
      return { song, diff, uncertaintyBonus };
    })
    .filter((c) => c.song.song_id !== songA.song_id)
    .sort((a, b) => {
      // Primary: closer strength difference
      // Secondary: higher uncertainty bonus (fewer comparisons)
      const diffScore = a.diff - b.diff;
      const uncertaintyScore = b.uncertaintyBonus - a.uncertaintyBonus;
      return diffScore * 0.7 + uncertaintyScore * 0.3;
    });

  if (candidates.length === 0) {
    // Should never happen if songs.length >= 2
    return songA;
  }

  // Expanded pool size (was 6, now 10)
  const poolSize = Math.min(10, candidates.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return candidates[randomIndex].song;
}

/**
 * Pairs two songs for a duel.
 * 
 * Strategy breakdown:
 * - 10% Top-vs-Top: Force top 5 songs to face each other (establishes hierarchy)
 * - 15% Calibration: Test a Top 10 song against a random opponent
 * - 15% Chaos: Completely random pair for discovery
 * - 60% Uncertainty-Weighted: Prioritize under-tested songs
 * 
 * Uses comparison_count to weight selection toward songs with fewer comparisons.
 */
export function getNextPair(songs: SessionSong[]): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  const roll = Math.random();

  // 1. Top-vs-Top Mode (10%): Force matches between current leaders
  // This ensures the top songs establish clear hierarchy among themselves
  if (roll < 0.10 && songs.length > 5) {
    const sortedByStrength = getSortedByStrength(songs);
    const top5 = sortedByStrength.slice(0, 5);
    return pickTwoRandom(top5);
  }

  // 2. Calibration Mode (15%): Test a Top 10 song against a random opponent
  // Helps validate top songs against the broader pool
  if (roll < 0.25 && songs.length > 10) {
    const sortedByRank = getSortedByStrength(songs);
    const topSongs = sortedByRank.slice(0, 10);
    const songA = topSongs[Math.floor(Math.random() * topSongs.length)];

    let songB = songs[Math.floor(Math.random() * songs.length)];
    while (songB.song_id === songA.song_id) {
      songB = songs[Math.floor(Math.random() * songs.length)];
    }
    return [songA, songB];
  }

  // 3. Chaos Mode (15%): Completely random pair for discovery
  // Ensures no song is completely isolated from comparisons
  if (roll < 0.40) {
    return pickTwoRandom(songs);
  }

  // 4. Uncertainty-Weighted Mode (60%): Prioritize under-tested songs
  // Songs with fewer comparisons get higher weight
  // Weight formula: 1 / (comparison_count + 1)
  // - Song with 0 comparisons: weight = 1.0
  // - Song with 5 comparisons: weight = 0.167
  const weights = songs.map((s) => 1 / ((s.comparison_count ?? 0) + 1));
  const songA = weightedRandomPick(songs, weights);
  
  // Find a diverse neighbor that also factors in uncertainty
  const songB = findDiverseNeighbor(songs, songA);

  return [songA, songB];
}
