import { Dynamic, Event, foldDyn, pipe } from "../frp";
import { attach } from "../frp/Event";
import { Point, vectorXY } from "../graphics/Geometry";
import { KEY_CODES, KEY_FLAGS } from "./keyboard";

export interface Ship {
  pos: Point;
  size: number;
  angle: number;
  vel: [number, number]; // [x, y]
}

interface ShipBounds {
  backLeft: Point;
  backRight: Point;
  nose: Point;
}

// Dimensions such that the center point is the triangle's centroid.
const shipBounds: ShipBounds = {
  backLeft: [-10, -15],
  backRight: [-10, 15],
  nose: [20, 0],
};

export const drawShip = (ctx: CanvasRenderingContext2D) => {
  const { nose, backLeft, backRight } = shipBounds;

  ctx.beginPath();
  ctx.moveTo(...backLeft);
  ctx.lineTo(...backRight);
  ctx.lineTo(...nose);
  ctx.closePath();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.stroke();
};

type ShipUpdate = (
  timeDelta: number,
  keysPressed: number,
) => (prevShip: Ship) => Ship;

export const updateShip = (
  timeDelta: Event<number>,
  keysPressed: Dynamic<number>,
  starterShip: Ship,
  // tslint:disable-next-line:trailing-comma
  ...updates: ShipUpdate[]
): Dynamic<Ship> =>
  foldDyn(
    (oldShip, [keyMask, delta]: [number, number]) =>
      pipe(...updates.map(update => update(delta, keyMask)))(oldShip),
    starterShip,
  )(attach(keysPressed, timeDelta));

// turnRate = degrees/ms (ie. give it (degrees/s) / 1000)
export const updateAngle = (turnRate: number): ShipUpdate => (
  timeDelta,
  keysPressed,
) => prevShip => {
  const a = KEY_FLAGS[KEY_CODES.a];
  const d = KEY_FLAGS[KEY_CODES.d];
  const directionKeysPressed = keysPressed & (a | d);
  const direction =
    directionKeysPressed === a ? -1 : directionKeysPressed === d ? 1 : 0;
  return {
    ...prevShip,
    angle: prevShip.angle + (turnRate / 180) * Math.PI * direction * timeDelta,
  };
};

// acceleration = px/ms^2 (ie. give it (px/s^2) / 1000)
export const updateVel = (acceleration: number): ShipUpdate => (
  timeDelta,
  keysPressed,
) => prevShip => {
  const [accelX, accelY] = vectorXY(
    keysPressed & KEY_FLAGS[KEY_CODES.w] ? acceleration * timeDelta : 0,
    prevShip.angle,
  );
  return {
    ...prevShip,
    vel: [prevShip.vel[0] + accelX, prevShip.vel[1] + accelY],
  };
};

export const updatePos: ShipUpdate = timeDelta => prevShip => ({
  ...prevShip,
  pos: [
    prevShip.pos[0] + prevShip.vel[0] * timeDelta,
    prevShip.pos[1] + prevShip.vel[1] * timeDelta,
  ],
});
