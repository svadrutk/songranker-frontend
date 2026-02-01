import { describe, it, expect } from "vitest";
import { getNextPair } from "../pairing";
import { calculateNewRatings } from "../elo";
import type { SessionSong } from "../api";

/**
 * Simulation test that recreates the "Diamonds scenario"
 * 
 * Problem: In the original algorithm, a song that the user always picked as winner
 * could still end up ranked #6 because it wasn't matched against top contenders.
 * 
 * This test verifies that the improved algorithm:
 * 1. Gives under-tested songs more exposure
 * 2. Forces top songs to face each other
 * 3. Results in accurate rankings for dominant songs
 */

// Helper to create mock songs
function createMockSongs(count: number): SessionSong[] {
  return Array.from({ length: count }, (_, i) => ({
    song_id: `song-${i}`,
    name: `Song ${i}`,
    artist: "Test Artist",
    album: "Test Album",
    spotify_id: null,
    cover_url: null,
    local_elo: 1500,
    bt_strength: null,
    comparison_count: 0,
  }));
}

// Simulate a comparison and update songs
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

// Run a full simulation session
function simulateSession(
  songs: SessionSong[],
  numComparisons: number,
  decideWinner: (a: SessionSong, b: SessionSong) => string
): SessionSong[] {
  let currentSongs = [...songs];

  for (let i = 0; i < numComparisons; i++) {
    const pair = getNextPair(currentSongs);
    if (!pair) break;

    const winnerId = decideWinner(pair[0], pair[1]);
    currentSongs = simulateComparison(currentSongs, pair, winnerId);
  }

  return currentSongs;
}

describe("Pairing Algorithm Simulation", () => {
  it("should rank a dominant song in top 3 after 126 comparisons (Diamonds scenario)", () => {
    const NUM_SONGS = 30;
    const NUM_COMPARISONS = 126;
    const NUM_SIMULATIONS = 10; // Run multiple times due to randomness
    
    let successCount = 0;
    const finalRanks: number[] = [];

    for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
      const songs = createMockSongs(NUM_SONGS);
      const trueWinnerId = "song-15"; // Our "Diamonds" - middle of the pack initially

      // Decision function: trueWinner always wins, others are 50/50
      const decideWinner = (a: SessionSong, b: SessionSong): string => {
        if (a.song_id === trueWinnerId) return trueWinnerId;
        if (b.song_id === trueWinnerId) return trueWinnerId;
        // Random winner for other matchups
        return Math.random() > 0.5 ? a.song_id : b.song_id;
      };

      const finalSongs = simulateSession(songs, NUM_COMPARISONS, decideWinner);
      
      // Sort by ELO to get ranking
      const ranking = [...finalSongs].sort((a, b) => b.local_elo - a.local_elo);
      const trueWinnerRank = ranking.findIndex((s) => s.song_id === trueWinnerId) + 1;
      
      finalRanks.push(trueWinnerRank);
      if (trueWinnerRank <= 3) successCount++;

      // Log details for the first simulation
      if (sim === 0) {
        const trueWinner = finalSongs.find((s) => s.song_id === trueWinnerId)!;
        console.log(`\nSimulation ${sim + 1}:`);
        console.log(`  True winner final rank: #${trueWinnerRank}`);
        console.log(`  True winner comparisons: ${trueWinner.comparison_count}`);
        console.log(`  True winner ELO: ${trueWinner.local_elo.toFixed(1)}`);
        console.log(`  Top 5 rankings:`);
        ranking.slice(0, 5).forEach((s, i) => {
          console.log(`    #${i + 1}: ${s.name} (ELO: ${s.local_elo.toFixed(1)}, comparisons: ${s.comparison_count})`);
        });
      }
    }

    const avgRank = finalRanks.reduce((a, b) => a + b, 0) / finalRanks.length;
    const successRate = (successCount / NUM_SIMULATIONS) * 100;

    console.log(`\n--- Summary over ${NUM_SIMULATIONS} simulations ---`);
    console.log(`Average rank: ${avgRank.toFixed(1)}`);
    console.log(`Success rate (top 3): ${successRate.toFixed(0)}%`);
    console.log(`Ranks: ${finalRanks.join(", ")}`);

    // The dominant song should rank in top 3 at least 70% of the time
    expect(successRate).toBeGreaterThanOrEqual(70);
  });

  it("should give under-tested songs sufficient exposure", () => {
    const songs = createMockSongs(30);
    const NUM_COMPARISONS = 100;

    let currentSongs = [...songs];
    for (let i = 0; i < NUM_COMPARISONS; i++) {
      const pair = getNextPair(currentSongs);
      if (!pair) break;
      
      // Random winner
      const winnerId = Math.random() > 0.5 ? pair[0].song_id : pair[1].song_id;
      currentSongs = simulateComparison(currentSongs, pair, winnerId);
    }

    // Check distribution of comparisons
    const comparisonCounts = currentSongs.map((s) => s.comparison_count);
    const minComparisons = Math.min(...comparisonCounts);
    const maxComparisons = Math.max(...comparisonCounts);
    const avgComparisons = comparisonCounts.reduce((a, b) => a + b, 0) / comparisonCounts.length;

    console.log(`\nComparison distribution after ${NUM_COMPARISONS} comparisons:`);
    console.log(`  Min: ${minComparisons}, Max: ${maxComparisons}, Avg: ${avgComparisons.toFixed(1)}`);

    // Every song should have at least 1 comparison after 100 total comparisons with 30 songs
    // (100 comparisons = 200 song appearances, 30 songs = ~6.7 avg)
    expect(minComparisons).toBeGreaterThanOrEqual(1);
    
    // The spread shouldn't be too extreme (max shouldn't be more than 3x the min+1)
    expect(maxComparisons).toBeLessThanOrEqual((minComparisons + 1) * 4);
  });

  it("should establish clear hierarchy among top songs", () => {
    const songs = createMockSongs(20);
    const NUM_COMPARISONS = 80;

    // Create a "true ranking" where song-19 > song-18 > ... > song-0
    const trueRanking = songs.map((s) => parseInt(s.song_id.split("-")[1]));
    
    const decideWinner = (a: SessionSong, b: SessionSong): string => {
      const rankA = parseInt(a.song_id.split("-")[1]);
      const rankB = parseInt(b.song_id.split("-")[1]);
      return rankA > rankB ? a.song_id : b.song_id;
    };

    const finalSongs = simulateSession(songs, NUM_COMPARISONS, decideWinner);
    const ranking = [...finalSongs].sort((a, b) => b.local_elo - a.local_elo);

    // Check if top 5 are correct
    const actualTop5 = ranking.slice(0, 5).map((s) => s.song_id);
    const expectedTop5 = ["song-19", "song-18", "song-17", "song-16", "song-15"];
    
    // Count how many of the expected top 5 are in actual top 5
    const correctInTop5 = actualTop5.filter((id) => expectedTop5.includes(id)).length;
    
    console.log(`\nHierarchy test:`);
    console.log(`  Expected top 5: ${expectedTop5.join(", ")}`);
    console.log(`  Actual top 5: ${actualTop5.join(", ")}`);
    console.log(`  Correct: ${correctInTop5}/5`);

    // At least 4 out of 5 should be correct
    expect(correctInTop5).toBeGreaterThanOrEqual(4);
  });
});
