/**
 * Assume that Job group types will never change.
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

export const getJobType = (type: string) => {
  switch (type) {
    case "A":
      return Job.A;
    case "B":
      return Job.B;
  }
};
