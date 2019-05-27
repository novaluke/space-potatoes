export type Point = [number, number]; // [xCoordinate, yCoordinate]

// Draws a tiny dot.
export const drawPoint = (
  ctx: CanvasRenderingContext2D,
  color: string,
  [x, y]: Point,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(x - 1, y - 1, 2, 2);
};
