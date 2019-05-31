export type Point = [number, number]; // [xCoordinate, yCoordinate]

// Draws a tiny dot.
export const drawPoint = (color: string) => (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = color;
  ctx.fillRect(-1, -1, 2, 2);
};

export interface Transforms {
  scale?: [number, number];
  angle?: number;
  translate?: [number, number];
}

export const withContext = (
  ctx: CanvasRenderingContext2D,
  { scale = [1, 1], angle = 0, translate = [0, 0] }: Transforms = {},
) => <R>(drawFn: (ctx: CanvasRenderingContext2D) => R): R => {
  ctx.save();

  ctx.translate(...translate);
  ctx.rotate(angle);
  ctx.scale(...scale);

  const output = drawFn(ctx);

  ctx.restore();

  return output;
};

export const vectorXY = (
  magnitude: number,
  angle: number,
): [number, number] => [
  Math.cos(angle) * magnitude,
  Math.sin(angle) * magnitude,
];

export const bound = (min: number, max: number, val: number) =>
  Math.max(min, Math.min(max, val));

const wrap = (max: number, val: number) => {
  // Shift the value positively by a screen if below the minimum bound,
  // negatively by a screen if above the maximum bound, and by no screens if
  // within bounds.
  return val + (val < 0 ? max : val > max ? -max : 0);
};

export const wrapOutOfBounds = (bounds: [number, number]) => <
  T extends { pos: Point }
>(
  prev: T,
): T => ({
  ...prev,
  pos: [wrap(bounds[0], prev.pos[0]), wrap(bounds[1], prev.pos[1])],
});
