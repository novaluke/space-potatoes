import "./index.css";

import { drawPoint } from "./Geometry";
import { drawShip, Ship } from "./Ship";

const canvas = document.getElementById("game-canvas")! as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const starterShip: Ship = {
  angle: 0,
  pos: [canvas.width / 2, canvas.height / 2],
  size: 20,
};

drawBackground(context);
drawShip(context, starterShip);
drawPoint(context, "red", starterShip.pos); // Ship center marker for debugging
