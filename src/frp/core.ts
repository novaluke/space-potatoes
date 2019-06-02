import { Subscriber } from "./Event";

let frameIsRunning = false;

// Can't get this properly typed without existential types, which TypeScript
// doesn't support
const nextFrameEmitters: Array<{ val: any; subs: Array<Subscriber<any>> }> = [];

// TODO see if we can handle `registerEmitter` and `runFrame` functionally
export const registerEmitter = <T>(val: T, subs: Array<Subscriber<T>>) => {
  nextFrameEmitters.push({ val, subs });
  if (!frameIsRunning) runFrame();
};

export const runFrame = () => {
  frameIsRunning = true;
  const thisFrame = nextFrameEmitters.slice();
  nextFrameEmitters.length = 0;

  thisFrame.forEach(({ val, subs }) => subs.forEach(sub => sub(val)));
  if (nextFrameEmitters.length !== 0) {
    runFrame();
  } else {
    frameIsRunning = false;
  }
};
