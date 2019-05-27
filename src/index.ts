import main from "./game/main";
import "./index.css";

const canvas = document.getElementById("game-canvas")! as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

main(context);
