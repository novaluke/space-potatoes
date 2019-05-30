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
