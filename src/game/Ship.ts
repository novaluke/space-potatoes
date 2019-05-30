import { Point } from "../graphics/Geometry";

export interface Ship {
  pos: Point;
  size: number;
  angle: number;
}

interface ShipBounds {
  backLeft: Point;
  backRight: Point;
  nose: Point;
}

// Dimensions such that the center point is the triangle's centroid.
const shipBounds: ShipBounds = {
  backLeft: [15, 10],
  backRight: [-15, 10],
  nose: [0, -20],
};

export const drawShip = (ctx: CanvasRenderingContext2D, ship: Ship) => {
  const { nose, backLeft, backRight } = shipBounds;

  ctx.save();

  ctx.translate(...ship.pos);
  ctx.rotate(ship.angle);

  ctx.beginPath();
  ctx.moveTo(...backLeft);
  ctx.lineTo(...backRight);
  ctx.lineTo(...nose);
  ctx.closePath();

  ctx.strokeStyle = "white";
  ctx.lineWidth = ship.size / 20;
  ctx.stroke();

  ctx.restore();
};
