import {
  concatDyn,
  constDyn,
  Dynamic,
  foldDyn,
  fromAnimationFrame,
  holdDyn,
  join,
  mapDyn,
} from "../frp";
import { mapEvt, mkEvent } from "../frp/Event";
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
  const dynExplosions: Dynamic<Array<Dynamic<Explosion>>> = foldDyn(
    (
      explosions,
      init: { radius: [number, number]; pos: Point; duration: number },
    ) => [...explosions, mkExplosion(init, fpsDelta)],
    [] as Array<Dynamic<Explosion>>,
  )(
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
  // Have to take a sample-based approach to checking the ship and asteroids or
  // we get weird order-of-event-occurrence issues between the shipDeath event
  // and ship update events. This would presumably not be an issue if the FRP
  // implementation followed proper semantics.
  fpsDelta.subscribe(() => {
    const ship = dynShip.value;
    const asteroids = flatAsteroids.value;
    if (ship !== null) {
      const hasCollided = !asteroids.every(
        asteroid => !circleCollision(ship.pos, 20, asteroid.pos, 40),
      );
      if (hasCollided) {
        emitShipDeath(ship.pos);
      }
    }
  });

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
