export const K_FACTOR = 32;

/**
 * Calculate dynamic K-factor based on time taken to decide.
 * Fast decisions (< 3s) imply strong preference -> higher K.
 * Slow decisions (> 10s) imply hesitation/weak preference -> lower K.
 */
export function calculateKFactor(timeMs: number): number {
  if (timeMs < 3000) return 48; // Fast decision, strong signal
  if (timeMs > 10000) return 16; // Slow decision, weak signal
  return 32; // Standard
}

/**
 * Calculate expected score for a player given their rating and the opponent's rating.
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ratings for two players after a match.
 * @param ratingA Current rating of player A
 * @param ratingB Current rating of player B
 * @param actualScoreA Score of player A (1 for win, 0.5 for tie, 0 for loss)
 * @param kFactor Optional K-factor override (defaults to standard 32)
 * @returns [newRatingA, newRatingB]
 */
export function calculateNewRatings(
  ratingA: number,
  ratingB: number,
  actualScoreA: number,
  kFactor: number = K_FACTOR
): [number, number] {
  const expectedA = getExpectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const actualScoreB = 1 - actualScoreA;

  const newRatingA = ratingA + kFactor * (actualScoreA - expectedA);
  const newRatingB = ratingB + kFactor * (actualScoreB - expectedB);

  return [newRatingA, newRatingB];
}
