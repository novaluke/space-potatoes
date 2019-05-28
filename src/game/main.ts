import { foldDyn, fromAnimationFrame } from "../frp";
import { drawPoint } from "../graphics/Geometry";
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

  const update = (angle: number) => {
    drawBackground(ctx);
    drawShip(ctx, { ...starterShip, angle });
    drawPoint(ctx, "red", starterShip.pos);
  };

  foldDyn(
    (sum, _) => sum + (1 / 180) * Math.PI, // increment by one degree each frame
    0, // initial value
    fromAnimationFrame(), // update source
  ).subscribe(update);
};
