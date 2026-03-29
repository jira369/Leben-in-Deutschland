/** Number of questions in an official Einbürgerungstest */
export const OFFICIAL_TEST_QUESTION_COUNT = 33;

/** Minimum correct answers to pass the official test (17 out of 33) */
export const OFFICIAL_PASS_THRESHOLD = 17;

/** Fisher-Yates shuffle — returns a new shuffled copy of the array */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
