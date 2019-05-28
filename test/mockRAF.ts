let originalRequestAnimationFrame: typeof requestAnimationFrame;
let now: number;
let isMocked = false;
let defaultDelta: number;

const callbacks: FrameRequestCallback[] = [];

const mockRequestAnimationFrame: typeof requestAnimationFrame = callback => {
  callbacks.push(callback);
  return callbacks.length - 1;
};

const runFrame = (timestamp: number) => {
  // Create a new list of callbacks before calling any of them, since the
  // callbacks will need to be able to register callbacks for the next animation
  // frame when called.
  const currentCallbacks = callbacks.slice();
  callbacks.length = 0;
  currentCallbacks.forEach(fn => fn(timestamp));
};

const cancel: typeof cancelAnimationFrame = id => callbacks.splice(id, 1);

const step = (times = 1, delta = defaultDelta) => {
  if (times < 1) return;
  now += delta;
  runFrame(now);
  step(times - 1);
};

const useMockRAF = ({
  initialNow = 0,
  delta = 1000 / 60,
}: MockRAFConfig = {}) => {
  if (isMocked) {
    throw new Error(
      "Can't use useMockRAF if RAF is already mocked - use restoreRAF first!",
    );
  }
  defaultDelta = delta;
  isMocked = true;
  now = initialNow;
  originalRequestAnimationFrame = requestAnimationFrame;
  jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation(mockRequestAnimationFrame);
};

const restoreRAF = () => {
  now = 0;
  callbacks.length = 0;
  window.requestAnimationFrame = originalRequestAnimationFrame;
  isMocked = false;
};

export interface MockRAFConfig {
  initialNow?: number;
  delta?: number;
}

export { now, cancel, step, useMockRAF, restoreRAF };
