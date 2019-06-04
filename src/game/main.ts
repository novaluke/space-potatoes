import {
  concatDyn,
  constDyn,
  Dynamic,
  Event,
  fromAnimationFrame,
  holdDyn,
  join,
  mapDyn,
} from "../frp";
import { mapEvt, mkEvent, tag } from "../frp/Event";
import {
  circleCollision,
  Point,
  withContext,
  wrapOutOfBounds,
} from "../graphics/Geometry";
import { Asteroid, drawAsteroid, mkAsteroid } from "./Asteroid";
import { drawExplosion, Explosion } from "./Explosion";
import { explosionList } from "./ExplosionList";
import { registerForKeyEvents } from "./keyboard";
import { drawShip, mkShip, Ship } from "./Ship";

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export default (ctx: CanvasRenderingContext2D) => {
  const bounds: [number, number] = [ctx.canvas.width, ctx.canvas.height];
  const starterShip: Ship = {
    angle: (-90 / 180) * Math.PI,
    dead: false,
    pos: [bounds[0] / 2, bounds[1] / 2],
    scale: 1,
    thrustPower: 0,
    vel: [0, 0],
  };
  const fpsDelta = fromAnimationFrame();
  const keysPressed = registerForKeyEvents();

  // TODO see if there's a way of doing this by FRP mapping rather than explicit pushing
  const [shipDeath, emitShipDeath] = mkEvent<Point>();

  const dynAsteroids: Array<Dynamic<Asteroid>> = Array(5)
    .fill(null)
    .map(() => mkAsteroid({ bounds, vertexCount: 10, radius: 40 }, fpsDelta));
  const dynShip = join(
    holdDyn<Dynamic<Ship> | Dynamic<null>>(
      mkShip(starterShip, keysPressed, fpsDelta, {
        bounds,
        acceleration: 0.25,
        turnRate: 180,
      }),
    )(mapEvt(() => constDyn(null))(shipDeath)),
  );
  const dynExplosions = explosionList(
    fpsDelta,
    mapEvt((pos: Point) => ({
      pos,
      duration: 0.5,
      radius: [20, 40] as [number, number],
    }))(shipDeath),
  );

  // RENDER
  const flatAsteroids = concatDyn(...dynAsteroids);
  const flatExplosions = join(
    mapDyn((explosions: Array<Dynamic<Explosion>>) => concatDyn(...explosions))(
      dynExplosions,
    ),
  );
  // Check if the ship has collided with an asteroid, and if so emit a death
  // event for it.
  concatDyn(dynShip, concatDyn(...dynAsteroids)).subscribe(
    ([ship, asteroids]) => {
      if (ship !== null) {
        const hasCollided = !asteroids.every(
          asteroid => !circleCollision(ship.pos, 20, asteroid.pos, 40),
        );
        if (hasCollided) {
          // TODO make the explosion happen at the intersection of Ship and Asteroid
          emitShipDeath(ship.pos);
        }
      }
    },
  );

  tag(concatDyn(dynShip, flatAsteroids, flatExplosions), fpsDelta).subscribe(
    ([ship, asteroids, explosions]) => {
      drawBackground(ctx);
      if (ship !== null) {
        withContext(ctx, { translate: ship.pos, angle: ship.angle })(
          drawShip(ship.thrustPower),
        );
      }
      asteroids.forEach(asteroid =>
        withContext(ctx, { translate: asteroid.pos })(drawAsteroid(asteroid)),
      );
      explosions.forEach(explosion =>
        withContext(ctx, { translate: explosion.pos })(
          drawExplosion(explosion),
        ),
      );
    },
  );
};
