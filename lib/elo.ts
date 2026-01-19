export const K_FACTOR = 32;

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
 * @returns [newRatingA, newRatingB]
 */
export function calculateNewRatings(
  ratingA: number,
  ratingB: number,
  actualScoreA: number
): [number, number] {
  const expectedA = getExpectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const actualScoreB = 1 - actualScoreA;

  const newRatingA = ratingA + K_FACTOR * (actualScoreA - expectedA);
  const newRatingB = ratingB + K_FACTOR * (actualScoreB - expectedB);

  return [newRatingA, newRatingB];
}
