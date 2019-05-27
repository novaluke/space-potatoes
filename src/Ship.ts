import { Point } from "./Geometry";

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

const shipBounds = ({ pos: [x, y], size, angle }: Ship): ShipBounds => {
  return {
    backLeft: [
      x - size * ((2 / 3) * Math.cos(angle) + Math.sin(angle)),
      y + size * ((2 / 3) * Math.sin(angle) - Math.cos(angle)),
    ],
    backRight: [
      x - size * ((2 / 3) * Math.cos(angle) - Math.sin(angle)),
      y + size * ((2 / 3) * Math.sin(angle) + Math.cos(angle)),
    ],
    nose: [
      x + (4 / 3) * size * Math.cos(angle),
      y - (4 / 3) * size * Math.sin(angle),
    ],
  };
};

export const drawShip = (ctx: CanvasRenderingContext2D, ship: Ship) => {
  const { nose, backLeft, backRight } = shipBounds(ship);

  ctx.beginPath();
  ctx.moveTo(...backLeft);
  ctx.lineTo(...backRight);
  ctx.lineTo(...nose);
  ctx.closePath();

  ctx.strokeStyle = "white";
  ctx.lineWidth = ship.size / 20;
  ctx.stroke();
};
