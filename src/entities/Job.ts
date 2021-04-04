// Assume that Job group types will not change.
// If the assumption isn't valid, then this can always be a relational database table.

/**
 * Enum for common Job groups.
 * @readonly
 * @enum {{name: string, rate: int}}
 */

export const Job = Object.freeze({
  A: {
    name: "A",
    rate: 20,
  },
  B: {
    name: "B",
    rate: 30,
  },
});
