import { type SessionSong } from "./api";

/**
 * Pairs two songs for a duel.
 * Strategy: Pick a random song, then find songs with the closest strength.
 * Uses Bradley-Terry strength if available, falling back to local Elo.
 */
export function getNextPair(songs: SessionSong[]): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  const roll = Math.random();

  // 1. Calibration Mode (15%): Test a Top 10 song against a random opponent
  if (roll < 0.15 && songs.length > 10) {
    const sortedByRank = [...songs].sort((a, b) => (b.bt_strength || 0) - (a.bt_strength || 0));
    const topSongs = sortedByRank.slice(0, 10);
    const songA = topSongs[Math.floor(Math.random() * topSongs.length)];
    
    let songB = songs[Math.floor(Math.random() * songs.length)];
    while (songB.song_id === songA.song_id) {
      songB = songs[Math.floor(Math.random() * songs.length)];
    }
    return [songA, songB];
  }

  // 2. Chaos Mode (15%): Completely random pair for discovery
  if (roll < 0.30) {
    const indexA = Math.floor(Math.random() * songs.length);
    let indexB = Math.floor(Math.random() * songs.length);
    while (indexB === indexA && songs.length > 1) {
      indexB = Math.floor(Math.random() * songs.length);
    }
    return [songs[indexA], songs[indexB]];
  }

  // 3. Standard Mode (70%): Closest neighbors for fine-tuning
  const indexA = Math.floor(Math.random() * songs.length);
  const songA = songs[indexA];

  const candidates = songs
    .map((song, index) => {
      let diff: number;
      if (songA.bt_strength != null && song.bt_strength != null) {
        diff = Math.abs(song.bt_strength - songA.bt_strength);
      } else {
        diff = Math.abs(song.local_elo - songA.local_elo) / 1000;
      }
      return { song, index, diff };
    })
    .filter((c) => c.index !== indexA)
    .sort((a, b) => a.diff - b.diff);

  if (candidates.length === 0) return null;

  const poolSize = Math.min(6, candidates.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  const songB = candidates[randomIndex].song;

  return [songA, songB];
}
