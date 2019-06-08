import {
  concatDyn,
  constDyn,
  Dynamic,
  fromAnimationFrame,
  holdDyn,
  join,
  mapDyn,
  mapEvt,
  merge,
  mkEvent,
  pipe,
  tag,
  takeUntil,
} from "../frp";
import { circleCollision, Point, withContext } from "../graphics/Geometry";
import { Asteroid, drawAsteroid, mkAsteroid } from "./Asteroid";
import { asteroidList } from "./AsteroidList";
import { Bullet, drawBullet } from "./Bullet";
import { bulletList } from "./BulletList";
import { drawExplosion, Explosion, mkExplosion } from "./Explosion";
import { explosionList } from "./ExplosionList";
import { registerForKeyEvents } from "./keyboard";
import { drawShip, mkShip, Ship } from "./Ship";

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

const flattenDynList = <T>(dynList: Dynamic<Array<Dynamic<T>>>): Dynamic<T[]> =>
  pipe(
    mapDyn((items: Array<Dynamic<T>>) => concatDyn(...items)),
    join,
  )(dynList);

export default (ctx: CanvasRenderingContext2D) => {
  const bounds: [number, number] = [ctx.canvas.width, ctx.canvas.height];
  const starterShip: Ship = {
    angle: (-90 / 180) * Math.PI,
    pos: [bounds[0] / 2, bounds[1] / 2],
    scale: 2,
    thrustPower: 0,
    vel: [0, 0],
  };
  const fpsDelta = fromAnimationFrame();
  const keysPressed = registerForKeyEvents();

  // TODO see if there's a way of doing this by FRP mapping rather than explicit pushing
  const [shipDeath, emitShipDeath] = mkEvent<Point>();
  const [asteroidDestroyed, emitAsteroidDestroyed] = mkEvent<number>();
  const [bulletDelete, emitBulletDelete] = mkEvent<number>();
  const [createExplosion, emitCreateExplosion] = mkEvent<
    Parameters<typeof mkExplosion>[0]
  >();

  const dynAsteroids = flattenDynList(
    asteroidList(
      Array(5)
        .fill(null)
        .map(() =>
          mkAsteroid({ bounds, vertexCount: 10, radius: 40 }, fpsDelta),
        ),
      asteroidDestroyed,
    ),
  );
  const [dynShip, fireEvents] = mkShip(starterShip, keysPressed, fpsDelta, {
    bounds,
    acceleration: 0.25,
    turnRate: 180,
  });
  const shipState = join(
    holdDyn<Dynamic<Ship> | Dynamic<null>>(dynShip)(
      mapEvt(() => constDyn(null))(shipDeath),
    ),
  );
  const dynExplosions = flattenDynList(
    explosionList(
      fpsDelta,
      merge(
        mapEvt((pos: Point) => ({
          pos,
          duration: 0.5,
          radius: [20, 40] as [number, number],
        }))(shipDeath),
        createExplosion,
      ),
    ),
  );

  const dynBullets = flattenDynList(
    bulletList(
      bounds,
      fpsDelta,
      takeUntil<Ship>(shipDeath)(fireEvents),
      bulletDelete,
    ),
  );

  // RENDER
  //
  // Check if the ship has collided with an asteroid, and if so emit a death
  // event for it.
  concatDyn(shipState, dynAsteroids).subscribe(([ship, asteroids]) => {
    if (ship !== null) {
      const hasCollided = !asteroids.every(
        asteroid => !circleCollision(ship.pos, 20, asteroid.pos, 40),
      );
      if (hasCollided) {
        // TODO make the explosion happen at the intersection of Ship and Asteroid
        emitShipDeath(ship.pos);
      }
    }
  });
  tag(concatDyn(dynBullets, dynAsteroids))(fpsDelta).subscribe(
    ([bullets, asteroids]) => {
      bullets.forEach((bullet, bulletIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
          if (circleCollision(bullet.pos, 3, asteroid.pos, 40)) {
            emitAsteroidDestroyed(asteroidIndex);
            emitBulletDelete(bulletIndex);
            emitCreateExplosion({
              duration: 0.5,
              pos: bullet.pos,
              radius: [3, 20],
            });
          }
        });
      });
    },
  );

  tag(concatDyn(dynBullets, shipState, dynAsteroids, dynExplosions))(
    fpsDelta,
  ).subscribe(([bullets, ship, asteroids, explosions]) => {
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
      withContext(ctx, { translate: explosion.pos })(drawExplosion(explosion)),
    );
    bullets.forEach(bullet =>
      withContext(ctx, { translate: bullet.pos })(drawBullet(bullet.pos)),
    );
  });
};
