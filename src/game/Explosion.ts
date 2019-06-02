import { Dynamic, Event, foldDyn } from "../frp";
import { Point } from "../graphics/Geometry";

export interface Explosion {
  radius: [number, number]; // start size, end size
  pos: Point;
  duration: number; // seconds
  elapsed: number; // seconds
}

export const updateExplosion = (
  prev: Explosion,
  timeDelta: number,
): Explosion => ({
  ...prev,
  elapsed: Math.min(prev.elapsed + timeDelta / 1000, prev.duration),
});

export const drawExplosion = ({
  radius,
  pos,
  duration,
  elapsed,
}: Explosion) => (ctx: CanvasRenderingContext2D) => {
  const pctComplete = elapsed / duration;
  const currentRadius = (radius[1] - radius[0]) * pctComplete + radius[0];

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
  gradient.addColorStop(0, "white");
  gradient.addColorStop(0.2, "yellow");
  gradient.addColorStop(1, "darkred");

  ctx.globalAlpha = 1 - pctComplete;

  ctx.beginPath();
  ctx.moveTo(...pos);
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();
};

export const mkExplosion = (
  // ctx: CanvasRenderingContext2D,
  init: { radius: [number, number]; pos: Point; duration: number },
  fpsDelta: Event<number>,
): Dynamic<Explosion> => {
  const dyn = foldDyn(updateExplosion, { ...init, elapsed: 0 })(fpsDelta);
  // TODO add takeWhile(explosion => explosion.elapsed < explosion.duration)
  // dyn.subscribe(explosion =>
  //   withContext(ctx, { translate: explosion.pos })(drawExplosion(explosion)),
  // );
  return dyn;
};
