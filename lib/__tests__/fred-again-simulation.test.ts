import { describe, it, expect } from "vitest";
import { getNextPair } from "../pairing";
import { calculateNewRatings } from "../elo";
import type { SessionSong } from "../api";

// Fred Again.. USB tracklist
const tracklist = [
  "ItsNotREEAALLLLLLLL (feat. Duoteque & Orion Sun)",
  "BerwynGesaffNeighbours (feat. Berwyn)",
  "stayinit (feat. Lil Yachty & Overmono)",
  "leavemealone (feat. Baby Keem)",
  "Baby again.. (feat. Skrillex & Four Tet)",
  "Rumble (feat. Skrillex & Flowdan)",
  "Turn On The Lights again.. (feat. Future)",
  "Jungle",
  "Admit It (u dont want 2)",
  "Lights Out (feat. Romy & HAAi)",
  "leavemealone (Nia Archives remix)",
  "Jungle (Rico Nasty Remix)",
  "Lights Out (HAAi Remix)"
];

const FAVORITE = "Turn On The Lights again.. (feat. Future)";

// Create mock songs
function createUSBSongs(): SessionSong[] {
  return tracklist.map((name, i) => ({
    song_id: `song-${i}`,
    name,
    artist: "Fred again..",
    album: "USB",
    spotify_id: null,
    cover_url: null,
    local_elo: 1500,
    bt_strength: null,
    comparison_count: 0,
  }));
}

// Simulate comparison
function simulateComparison(
  songs: SessionSong[],
  pair: [SessionSong, SessionSong],
  winnerId: string
): SessionSong[] {
  const [songA, songB] = pair;
  const scoreA = winnerId === songA.song_id ? 1 : winnerId === songB.song_id ? 0 : 0.5;
  const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

  return songs.map((s) => {
    if (s.song_id === songA.song_id) {
      return { ...s, local_elo: newEloA, comparison_count: s.comparison_count + 1 };
    }
    if (s.song_id === songB.song_id) {
      return { ...s, local_elo: newEloB, comparison_count: s.comparison_count + 1 };
    }
    return s;
  });
}

describe("Fred Again.. USB Simulation", () => {
  it("should rank 'Turn On The Lights again..' as #1 when always picked", () => {
    const songs = createUSBSongs();
    const favoriteId = songs.find(s => s.name === FAVORITE)!.song_id;
    
    console.log("\n=== Fred Again.. USB Ranking Simulation ===");
    console.log(`Favorite: "${FAVORITE}"`);
    console.log(`Songs: ${songs.length}`);

    let currentSongs = [...songs];
    const NUM_COMPARISONS = 50;

    for (let i = 0; i < NUM_COMPARISONS; i++) {
      const pair = getNextPair(currentSongs);
      if (!pair) break;
      
      // Always pick favorite if present, otherwise random
      let winnerId: string;
      if (pair[0].song_id === favoriteId) {
        winnerId = favoriteId;
      } else if (pair[1].song_id === favoriteId) {
        winnerId = favoriteId;
      } else {
        winnerId = Math.random() > 0.5 ? pair[0].song_id : pair[1].song_id;
      }
      
      currentSongs = simulateComparison(currentSongs, pair, winnerId);
    }

    // Sort by ELO
    const ranking = [...currentSongs].sort((a, b) => b.local_elo - a.local_elo);

    console.log("\n=== Final Rankings ===");
    ranking.forEach((s, i) => {
      const marker = s.name === FAVORITE ? " ⭐" : "";
      console.log(`#${String(i + 1).padStart(2)}  ${s.name}${marker}`);
      console.log(`     ELO: ${s.local_elo.toFixed(1)} | Comparisons: ${s.comparison_count}`);
    });

    const favoriteRank = ranking.findIndex(s => s.name === FAVORITE) + 1;
    const favorite = currentSongs.find(s => s.name === FAVORITE)!;
    
    console.log(`\n✓ "${FAVORITE}" finished at rank #${favoriteRank}`);
    console.log(`  Comparisons: ${favorite.comparison_count}`);
    console.log(`  Final ELO: ${favorite.local_elo.toFixed(1)}`);

    // Should be ranked #1
    expect(favoriteRank).toBe(1);
  });
});
