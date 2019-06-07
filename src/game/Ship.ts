import {
  attach,
  Dynamic,
  Event,
  foldDyn,
  mapEvtMaybe,
  pipe,
  tag,
  throttle,
} from "../frp";
import {
  bound,
  Point,
  vectorXY,
  withContext,
  wrapOutOfBounds,
} from "../graphics/Geometry";
import { KEY_CODES, KEY_FLAGS } from "./keyboard";

export interface Ship {
  pos: Point;
  scale: number;
  angle: number;
  vel: [number, number]; // [x, y]
  thrustPower: number; // between 0 and 1, where 1 is max power reached
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

const fireInterval = 0.5 * 1000; // milliseconds

export const drawShip = (thrustPower: number) => (
  ctx: CanvasRenderingContext2D,
) => {
  const { nose, backLeft, backRight } = shipBounds;

  // Draw thruster first so the ship is overlaid over it, hiding any overlap
  // with the thruster's stroke width.
  if (thrustPower) withContext(ctx)(drawThruster(thrustPower));

  ctx.beginPath();
  ctx.moveTo(...backLeft);
  ctx.lineTo(...backRight);
  ctx.lineTo(...nose);
  ctx.closePath();

  ctx.fillStyle = "black";
  ctx.fill(); // Fill in any overlap with the thruster.
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawThruster = (power: number) => (ctx: CanvasRenderingContext2D) => {
  const center = [-25 * power, 0 * power] as Point;
  const left = [-10 * power, -6 * power] as Point;
  const right = [-10 * power, 6 * power] as Point;

  ctx.beginPath();
  ctx.moveTo(...left);
  ctx.lineTo(...center);
  ctx.lineTo(...right);
  ctx.closePath();

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "red";
  ctx.fill();
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
  const thrusting = !!(keysPressed & KEY_FLAGS[KEY_CODES.w]);
  const [accelX, accelY] = vectorXY(
    thrusting ? acceleration * timeDelta : 0,
    prevShip.angle,
  );
  return {
    ...prevShip,
    thrustPower: bound(0, 1, prevShip.thrustPower + (thrusting ? 0.15 : -0.5)),
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

export const mkShip = (
  initialState: Ship,
  keysPressed: Dynamic<number>,
  fpsDelta: Event<number>,
  // Config values are in units per *second*
  {
    turnRate,
    acceleration,
    bounds,
  }: { turnRate: number; acceleration: number; bounds: [number, number] },
): [Dynamic<Ship>, Event<Ship>] => {
  const ship = foldDyn((state, [keyMask, timeDelta]: [number, number]) => {
    const updates = [
      updateAngle(turnRate / 1000),
      updateVel(acceleration / 1000),
      updatePos,
      () => wrapOutOfBounds(bounds),
    ];
    return pipe(...updates.map(update => update(timeDelta, keyMask)))(state);
  }, initialState)(attach(keysPressed, fpsDelta));
  const fireEvents = pipe(
    mapEvtMaybe((keyMask: number) =>
      keyMask & KEY_FLAGS[KEY_CODES.space] ? {} : null,
    ),
    throttle(fireInterval),
    // TODO consider having tag and attach be partially applied so that this
    // isn't required
    tag.bind<null, Dynamic<Ship>, [Event<any>], Event<Ship>>(null, ship),
  )(tag(keysPressed, fpsDelta));
  return [ship, fireEvents];
};
