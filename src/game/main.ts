import { fromAnimationFrame } from "../frp";
import { drawPoint, Transforms, withContext } from "../graphics/Geometry";
import { registerForKeyEvents } from "./keyboard";
import {
  drawShip,
  Ship,
  updateAngle,
  updatePos,
  updateShip,
  updateVel,
} from "./Ship";

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export default (ctx: CanvasRenderingContext2D) => {
  const starterShip: Ship = {
    angle: (-90 / 180) * Math.PI,
    pos: [ctx.canvas.width / 2, ctx.canvas.height / 2],
    size: 20,
    vel: [0, 0],
  };

  const fpsDelta = fromAnimationFrame();
  const keysPressed = registerForKeyEvents();

  const dynShip = updateShip(
    fpsDelta,
    keysPressed,
    starterShip,
    updateAngle(180 / 1000),
    updateVel(0.25 / 1000),
    updatePos,
  );

  const render = (ship: Ship) => {
    drawBackground(ctx);
    const shipRelative: Transforms = {
      angle: ship.angle,
      translate: ship.pos,
    };
    withContext(ctx, shipRelative)(drawShip);
    withContext(ctx, shipRelative)(drawPoint("red"));
  };

  dynShip.subscribe(render);
};
