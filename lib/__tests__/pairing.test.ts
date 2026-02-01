import { describe, it, expect } from "vitest";
import { getNextPair } from "../pairing";
import type { SessionSong } from "../api";

// Helper to create mock songs
function createMockSongs(count: number, options?: {
  withBtStrength?: boolean;
  comparisonCounts?: number[];
}): SessionSong[] {
  return Array.from({ length: count }, (_, i) => ({
    song_id: `song-${i}`,
    name: `Song ${i}`,
    artist: "Test Artist",
    album: "Test Album",
    spotify_id: null,
    cover_url: null,
    local_elo: 1500 + (i - count / 2) * 50, // Spread ELOs around 1500
    bt_strength: options?.withBtStrength ? 1 + i * 0.1 : null,
    comparison_count: options?.comparisonCounts?.[i] ?? 0,
  }));
}

describe("getNextPair", () => {
  it("should return null for fewer than 2 songs", () => {
    expect(getNextPair([])).toBeNull();
    expect(getNextPair([createMockSongs(1)[0]])).toBeNull();
  });

  it("should return a pair for 2 or more songs", () => {
    const songs = createMockSongs(2);
    const pair = getNextPair(songs);
    expect(pair).not.toBeNull();
    expect(pair!.length).toBe(2);
  });

  it("should never return the same song twice", () => {
    const songs = createMockSongs(10);
    
    // Run many iterations to catch any bugs
    for (let i = 0; i < 1000; i++) {
      const pair = getNextPair(songs);
      expect(pair).not.toBeNull();
      expect(pair![0].song_id).not.toBe(pair![1].song_id);
    }
  });

  it("should prefer under-tested songs when comparison counts differ", () => {
    // Create songs where some have many comparisons and some have none
    const songs = createMockSongs(20, {
      comparisonCounts: [
        0, 0, 0, 0, 0, // 5 songs with 0 comparisons
        10, 10, 10, 10, 10, // 5 songs with 10 comparisons
        20, 20, 20, 20, 20, // 5 songs with 20 comparisons
        30, 30, 30, 30, 30, // 5 songs with 30 comparisons
      ],
    });

    const underTestedIds = new Set(["song-0", "song-1", "song-2", "song-3", "song-4"]);
    let underTestedSelected = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const pair = getNextPair(songs);
      if (pair) {
        if (underTestedIds.has(pair[0].song_id)) underTestedSelected++;
        if (underTestedIds.has(pair[1].song_id)) underTestedSelected++;
      }
    }

    // Under-tested songs (25% of pool) should appear more than 25% of the time
    // due to uncertainty weighting (60% of the time in uncertainty mode)
    const selectionRate = underTestedSelected / (iterations * 2);
    console.log(`Under-tested song selection rate: ${(selectionRate * 100).toFixed(1)}%`);
    
    // Should be significantly higher than the baseline 25%
    expect(selectionRate).toBeGreaterThan(0.30);
  });

  it("should include top songs in pairings (top-vs-top and calibration modes)", () => {
    const songs = createMockSongs(30, { withBtStrength: true });
    
    // Top 5 song IDs (highest bt_strength)
    const top5Ids = new Set(["song-25", "song-26", "song-27", "song-28", "song-29"]);
    let top5InPair = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const pair = getNextPair(songs);
      if (pair) {
        const hasTop5 = top5Ids.has(pair[0].song_id) || top5Ids.has(pair[1].song_id);
        if (hasTop5) top5InPair++;
      }
    }

    // Top 5 should appear in at least 20% of pairings
    // (10% top-vs-top + 15% calibration + some from uncertainty mode)
    const top5Rate = top5InPair / iterations;
    console.log(`Top 5 appearance rate: ${(top5Rate * 100).toFixed(1)}%`);
    
    expect(top5Rate).toBeGreaterThan(0.20);
  });

  it("should work when bt_strength is null (fallback to local_elo)", () => {
    const songs = createMockSongs(20, { withBtStrength: false });
    
    // Should not throw and should return valid pairs
    for (let i = 0; i < 100; i++) {
      const pair = getNextPair(songs);
      expect(pair).not.toBeNull();
      expect(pair![0]).toBeDefined();
      expect(pair![1]).toBeDefined();
    }
  });

  it("should handle all songs having equal comparison counts", () => {
    const songs = createMockSongs(10, {
      comparisonCounts: Array(10).fill(5),
    });

    // Should still work without errors
    for (let i = 0; i < 100; i++) {
      const pair = getNextPair(songs);
      expect(pair).not.toBeNull();
    }
  });

  it("should handle edge case of exactly 2 songs", () => {
    const songs = createMockSongs(2);
    const pair = getNextPair(songs);
    
    expect(pair).not.toBeNull();
    expect(pair![0].song_id).toBe("song-0");
    expect(pair![1].song_id).toBe("song-1");
    // Order might vary, so check both are present
    const ids = [pair![0].song_id, pair![1].song_id].sort();
    expect(ids).toEqual(["song-0", "song-1"]);
  });
});
