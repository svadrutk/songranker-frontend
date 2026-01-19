import { type SessionSong } from "./api";

/**
 * Pairs two songs for a duel.
 * Strategy: Pick a random song, then find songs with the closest strength.
 * Uses Bradley-Terry strength if available, falling back to local Elo.
 */
export function getNextPair(songs: SessionSong[]): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  // Pick a random song as the first contestant
  const indexA = Math.floor(Math.random() * songs.length);
  const songA = songs[indexA];

  // Calculate differences for all other songs
  // If BT strength is available, we use that for more accurate adaptive pairing
  const candidates = songs
    .map((song, index) => {
      let diff: number;
      if (songA.bt_strength != null && song.bt_strength != null) {
        // BT strengths are typically small positive numbers; we use them directly
        diff = Math.abs(song.bt_strength - songA.bt_strength);
      } else {
        // Fallback to normalized Elo diff (scale of ~1000-2000)
        diff = Math.abs(song.local_elo - songA.local_elo) / 1000;
      }

      return {
        song,
        index,
        diff,
      };
    })
    .filter((c) => c.index !== indexA)
    .sort((a, b) => a.diff - b.diff);

  if (candidates.length === 0) return null;

  // Pick from the top 3 closest matches to add some variety while keeping matchups competitive
  const poolSize = Math.min(3, candidates.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  const songB = candidates[randomIndex].song;

  return [songA, songB];
}
