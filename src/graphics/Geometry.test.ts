import { vectorXY } from "./Geometry";

describe("Geometry", () => {
  describe("splitXY", () => {
    it("returns the x and y components of a vector", () => {
      const magnitudes = [1, 10, 5];
      const angles = [0, 90, 180, 360, 360 + 90, -90, 11, 111];
      const combinations = magnitudes.reduce(
        (acc, magnitude) => [
          ...acc,
          ...angles.map(angle => [magnitude, angle]),
        ],
        [] as number[][],
      );
      combinations.forEach(([mag, angle]) =>
        expect(vectorXY(mag, angle)).toEqual([
          Math.cos(angle) * mag,
          Math.sin(angle) * mag,
        ]),
      );
    });
  });
});
