import { bound, Point, vectorXY, wrapOutOfBounds } from "./Geometry";

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

  describe("wrapOutOfBounds", () => {
    it("works on any object with a pos property", () => {
      const foo = "bar";
      const pos: Point = [1, 2];
      const hasPos = { foo, pos };

      const output = wrapOutOfBounds([100, 200])(hasPos);

      expect(output).toHaveProperty("foo", foo);
      expect(output).toHaveProperty("pos", [
        expect.any(Number),
        expect.any(Number),
      ]);
    });

    it("does not mutate the input object", () => {
      const hasPos = Object.freeze({ foo: "bar", pos: [1, 2] as Point });

      expect(() => wrapOutOfBounds([100, 200])(hasPos)).not.toThrow();
    });

    it("moves out of bounds coordinates back into bounds based on how far out they were", () => {
      const bounds: Point = [100, 200];
      const wrapPoint = (pos: Point) => wrapOutOfBounds(bounds)({ pos }).pos;

      const point1: Point = [-5, -10];
      const point2: Point = [bounds[0] + 5, bounds[1] + 10];

      const out1 = wrapPoint(point1);
      const out2 = wrapPoint(point2);

      expect(out1[0]).toBe(bounds[0] - 5);
      expect(out1[1]).toBe(bounds[1] - 10);

      expect(out2[0]).toBe(5);
      expect(out2[1]).toBe(10);
    });

    it("doesn't change in-bounds coordinates", () => {
      const bounds: Point = [100, 200];
      const points: Point[] = [[0, 0], bounds];

      points.forEach(point => {
        const obj = { pos: point };
        const { pos: out } = wrapOutOfBounds(bounds)(obj);
        expect(out).toEqual(point);
      });
    });

    // TODO doesn't seem necessary at this point, for two reasons: 1) wrapping will be applied
    // each frame, so objects more than one screen out will be brought back in
    // eventually and rapidly. 2) Anything moving fast enough to get this many
    // screens out is a bug anyway.
    // it("recursively wraps coordinates that are multiple screens out", () => {});
  });

  describe("bound", () => {
    it("caps any value beyond the maximum", () => {
      const max = 100;
      const tooLarge = max + 1;
      expect(bound(0, max, tooLarge)).toBe(max);
    });

    it("caps any value below the minimum", () => {
      const min = -100;
      const tooSmall = min - 1;
      expect(bound(min, 0, tooSmall)).toBe(min);
    });

    it("doesn't change values within the bounds", () => {
      const min = -100;
      const max = 100;
      const val = 0;
      expect(bound(min, max, val)).toBe(val);
    });
  });
});
