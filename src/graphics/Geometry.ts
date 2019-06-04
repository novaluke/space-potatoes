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

export const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export const distanceBetweenPoints = (a: Point, b: Point) =>
  Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);

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

interface DrawConfig {
  strokeStyle?: string;
  lineWidth?: number;
  fillStyle?: string;
}

export const drawPoly = (vertices: Point[], config: DrawConfig = {}) => (
  ctx: CanvasRenderingContext2D,
) => {
  // Apply the config options to the context.
  (Object.keys(config) as Array<keyof DrawConfig>).forEach(method => {
    const foo = config[method];
    if (foo) ctx[method] = foo;
  });
  ctx.beginPath();
  vertices.forEach(([x, y], index) =>
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y),
  );
  ctx.closePath();
  // Fill before stroke or the fill will clip part of the stroke (stroke is
  // rendered as centered, ie. half-in and half-out of the shape).
  if (config.fillStyle) ctx.fill();
  ctx.stroke();
};

export const circleCollision = (
  aPos: Point,
  aRadius: number,
  bPos: Point,
  bRadius: number,
) => distanceBetweenPoints(aPos, bPos) < aRadius + bRadius;
