import {
  concatDyn,
  constDyn,
  Dynamic,
  Event,
  foldDyn,
  fromAnimationFrame,
  holdDyn,
  join,
  mapDyn,
  pipe,
  splitDyn,
} from "../frp";
import { switchDyn } from "../frp/Dynamic";
import { mapEvt, merge, mkEvent } from "../frp/Event";
import {
  circleCollision,
  Point,
  withContext,
  wrapOutOfBounds,
} from "../graphics/Geometry";
import { Asteroid, drawAsteroid, mkAsteroid } from "./Asteroid";
import { drawExplosion, Explosion, mkExplosion } from "./Explosion";
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
      mapDyn<Ship, Ship>(wrapOutOfBounds(bounds))(
        mkShip(starterShip, keysPressed, fpsDelta, {
          acceleration: 0.25,
          turnRate: 180,
        }),
      ),
    )(mapEvt(() => constDyn(null))(shipDeath)),
  );

  type Update<T> = (state: T) => T;
  type ExplosionsState = [Array<Dynamic<Explosion>>, Array<Event<number>>];

  const [explosionEnd, emitExplosionEnd] = mkEvent<number>();

  const $dynExplosions: [
    Dynamic<ExplosionsState[0]>,
    Dynamic<ExplosionsState[1]>
  ] = splitDyn(
    foldDyn(
      (state: ExplosionsState, update: Update<ExplosionsState>) =>
        update(state),
      [[], []] as ExplosionsState,
    )(
      merge(
        mapEvt<Point, Update<ExplosionsState>>(
          pos => ([explosions, endEvents]) => {
            const output = mkExplosion(
              {
                pos,
                duration: 0.5,
                radius: [20, 40] as [number, number],
              },
              fpsDelta,
            );
            return [
              [...explosions, output[0]],
              [...endEvents, mapEvt(() => endEvents.length)(output[1])],
            ];
          },
        )(shipDeath),
        mapEvt<number, Update<ExplosionsState>>(
          index => ([explosions, endEvents]) => {
            return [
              explosions.slice(0, index).concat(explosions.slice(index + 1)),
              endEvents.slice(0, index).concat(endEvents.slice(index + 1)),
            ];
          },
        )(explosionEnd),
      ),
    ),
  );
  // Connect explosion end events back up into the prepared event stream
  pipe(
    mapDyn((x: Array<Event<number>>) => merge(...x)),
    // Workaround for `pipe` not being able to figure out types properly.
    // TODO find a way to not need explicit types here, or a wrapping fn.
    (dyn: Dynamic<Event<number>>) => switchDyn<number>(dyn),
  )($dynExplosions[1]).subscribe(emitExplosionEnd);

  // RENDER
  const flatAsteroids = concatDyn(...dynAsteroids);
  const flatExplosions = join(
    mapDyn((explosions: Array<Dynamic<Explosion>>) => concatDyn(...explosions))(
      $dynExplosions[0],
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

  concatDyn(dynShip, flatAsteroids, flatExplosions).subscribe(
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
