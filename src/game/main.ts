import { foldDyn, fromAnimationFrame, mapEvt, pipe } from "../frp";
import { holdDyn } from "../frp/Dynamic";
import { drawPoint } from "../graphics/Geometry";
import { isPressed, registerForKeyEvents } from "./keyboard";
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

  const isThrusting = pipe(
    mapEvt((keysPressed: number) => isPressed("w", keysPressed)),
    holdDyn(false),
  )(registerForKeyEvents());

  const updateShip = (ship: Ship): Ship => ({
    ...ship,
    angle: ship.angle + (1 / 180) * Math.PI,
    pos: [ship.pos[0], isThrusting.value ? ship.pos[1] - 2 : ship.pos[1]],
  });

  const render = (ship: Ship) => {
    drawBackground(ctx);
    drawShip(ctx, ship);
    drawPoint(ctx, "red", ship.pos);
  };

  foldDyn(updateShip, starterShip)(fromAnimationFrame()).subscribe(render);
};
