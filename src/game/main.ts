import {
  Dynamic,
  foldDyn,
  fromAnimationFrame,
  holdDyn,
  mapEvt,
  pipe,
} from "../frp";
import { drawPoint } from "../graphics/Geometry";
import { KEY_CODES, KEY_FLAGS, registerForKeyEvents } from "./keyboard";
import { drawShip, Ship } from "./Ship";

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export default (ctx: CanvasRenderingContext2D) => {
  const starterShip: Ship = {
    angle: 0,
    pos: [ctx.canvas.width / 2, ctx.canvas.height / 2],
    size: 20,
  };

  const turningModifier: Dynamic<-1 | 0 | 1> = pipe(
    mapEvt((keysPressed: number) => {
      const a = KEY_FLAGS[KEY_CODES.a];
      const d = KEY_FLAGS[KEY_CODES.d];
      if ((keysPressed & (a | d)) === d) {
        return -1;
      }
      if ((keysPressed & (a | d)) === a) {
        return 1;
      }
      return 0;
    }),
    holdDyn(0 as -1 | 0 | 1),
  )(registerForKeyEvents());

  const thrustModifier: Dynamic<-1 | 0 | 1> = pipe(
    mapEvt((keysPressed: number) => {
      const w = KEY_FLAGS[KEY_CODES.w];
      const s = KEY_FLAGS[KEY_CODES.s];
      if ((keysPressed & (w | s)) === w) {
        return -1;
      }
      if ((keysPressed & (w | s)) === s) {
        return 1;
      }
      return 0;
    }),
    holdDyn(0 as -1 | 0 | 1),
  )(registerForKeyEvents());

  const updateShip = (ship: Ship): Ship => ({
    ...ship,
    angle: ship.angle + (1 / 180) * Math.PI * turningModifier.value,
    pos: [ship.pos[0], ship.pos[1] + 2 * thrustModifier.value],
  });

  const render = (ship: Ship) => {
    drawBackground(ctx);
    drawShip(ctx, ship);
    drawPoint(ctx, "red", ship.pos);
  };

  foldDyn(updateShip, starterShip)(fromAnimationFrame()).subscribe(render);
};
