import { Event, foldDyn } from "../frp";
import {
  drawPoly,
  Point,
  randomBetween,
  wrapOutOfBounds,
} from "../graphics/Geometry";
import { Asteroid } from "./Asteroid";

export interface Asteroid {
  vertices: Point[];
  pos: Point;
  scale: number;
  vel: [number, number];
}

export const drawAsteroid = ({ vertices }: Asteroid) => (
  ctx: CanvasRenderingContext2D,
) => {
  drawPoly(vertices, {
    fillStyle: "black",
    lineWidth: 1,
    strokeStyle: "slategrey",
  })(ctx);
};

export const randomAsteroid = (
  vertexCount: number,
  radius: number,
  bounds: [number, number],
): Asteroid => {
  const vertex = (index: number): Point => {
    const thisRadius = randomBetween(radius * 0.75, radius * 1.25);
    return [
      thisRadius * Math.cos((index * Math.PI * 2) / vertexCount),
      thisRadius * Math.sin((index * Math.PI * 2) / vertexCount),
    ];
  };
  return {
    pos: [
      Math.floor(Math.random() * bounds[0]),
      Math.floor(Math.random() * bounds[1]),
    ],
    scale: 1,
    vel: [
      ((Math.random() * (50 - 25) + 25) / 1000) * // random between 50 and 25
        (Math.random() > 0.5 ? 1 : -1), // 50% chance of positive or negative
      // y follows same logic as x
      ((Math.random() * (50 - 25) + 25) / 1000) *
        (Math.random() > 0.5 ? 1 : -1),
    ],
    vertices: Array(vertexCount)
      .fill(null)
      .map((_, index) => vertex(index)),
  };
};

interface Config {
  vertexCount: number;
  radius: number;
  bounds: [number, number];
}
export const mkAsteroid = (
  // ctx: CanvasRenderingContext2D,
  { vertexCount, radius, bounds }: Config,
  fpsDelta: Event<number>,
) => {
  const asteroid = randomAsteroid(vertexCount, radius, bounds);
  const dyn = foldDyn(
    (roid, timeDelta: number) =>
      wrapOutOfBounds(bounds)({
        ...roid,
        pos: [
          roid.pos[0] + roid.vel[0] * timeDelta,
          roid.pos[1] + roid.vel[1] * timeDelta,
        ],
      }),
    asteroid,
  )(fpsDelta);
  // dyn.subscribe(roid =>
  //   withContext(ctx, { translate: roid.pos })(drawAsteroid(roid)),
  // );
  return dyn;
};
