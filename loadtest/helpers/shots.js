/**
 * Shot coordinate generator for k6 load tests.
 * Generates a shuffled queue of all 100 cells (10x10 grid) using Fisher-Yates shuffle.
 * Guarantees no duplicate shots.
 */

/**
 * Fisher-Yates (Knuth) shuffle — mutates array in place.
 */
export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Creates a shuffled array of all 100 grid cells [{row, col}].
 * Pop from end for O(1) access.
 */
export function createShotQueue() {
  const cells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      cells.push({ row, col });
    }
  }
  return shuffleArray(cells);
}
