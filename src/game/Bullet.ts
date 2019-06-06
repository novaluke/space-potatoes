import { Dynamic, Event, filter, foldDyn, never, pipe } from "../frp";
import { take } from "../frp/Event";
import { Point, vectorXY, wrapOutOfBounds } from "../graphics/Geometry";
import { Ship } from "./Ship";

export interface Bullet {
  pos: Point;
  vel: [number, number];
  elapsed: number;
}

const bulletVel = 250 / 1000;
const bulletLifetime = 2.5 * 1000; // milliseconds

export const drawBullet = (pos: Point) => (ctx: CanvasRenderingContext2D) => {
  const radius = 3;
  ctx.beginPath();

  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();

  ctx.fillStyle = "white";
  ctx.fill();
};

const updateBullet = (
  { pos, vel, elapsed }: Bullet,
  timeDelta: number,
): Bullet => ({
  vel,
  elapsed: elapsed + timeDelta,
  pos: [pos[0] + vel[0] * timeDelta, pos[1] + vel[1] * timeDelta],
});

export const mkBullet = (
  ship: Ship,
  bounds: [number, number],
  fpsDelta: Event<number>,
): [Dynamic<Bullet>, Event<{}>] => {
  const addedVel = vectorXY(bulletVel, ship.angle);
  const initialState: Bullet = {
    elapsed: 0,
    pos: ship.pos,
    vel: [ship.vel[0] + addedVel[0], ship.vel[1] + addedVel[1]],
  };
  const bullet = foldDyn(
    pipe(
      updateBullet,
      wrapOutOfBounds(bounds),
    ),
    initialState,
  )(fpsDelta);
  const endEvent = pipe(
    filter(({ elapsed }: Bullet) => elapsed >= bulletLifetime),
    take(1),
  )(bullet);
  return [bullet, endEvent];
};
