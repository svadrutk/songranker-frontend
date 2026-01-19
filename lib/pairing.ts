import { type SessionSong } from "./api";

/**
 * Pairs two songs for a duel.
 * Strategy: Pick a random song, then find the song with the closest Elo rating.
 */
export function getNextPair(songs: SessionSong[]): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  // Pick a random song as the first contestant
  const indexA = Math.floor(Math.random() * songs.length);
  const songA = songs[indexA];

  // Find the song with the closest Elo to songA (excluding songA itself)
  let closestSongB: SessionSong | null = null;
  let minDiff = Infinity;

  for (let i = 0; i < songs.length; i++) {
    if (i === indexA) continue;
    
    const diff = Math.abs(songs[i].local_elo - songA.local_elo);
    if (diff < minDiff) {
      minDiff = diff;
      closestSongB = songs[i];
    } else if (diff === minDiff) {
      // Tie-breaker: random
      if (Math.random() > 0.5) {
        closestSongB = songs[i];
      }
    }
  }

  if (!songA || !closestSongB) return null;

  return [songA, closestSongB];
}
