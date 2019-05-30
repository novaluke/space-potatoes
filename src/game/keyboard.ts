import {
  Dynamic,
  filter,
  foldDyn,
  fromDOMEvent,
  mapEvt,
  merge,
  pipe,
} from "../frp";

// tslint:disable:object-literal-sort-keys
export const KEY_CODES = Object.freeze({
  w: "KeyW" as "KeyW",
  a: "KeyA" as "KeyA",
  s: "KeyS" as "KeyS",
  d: "KeyD" as "KeyD",
});
// tslint:enable:object-literal-sort-keys

export const KEY_FLAGS: KeyFlags = Object.freeze(
  Object.values(KEY_CODES).reduce(
    (out, code, index) => ({ ...out, [code]: 1 << index }),
    {} as KeyFlags,
  ),
);

export const NO_KEYS = 0;

type KeyFlags = Readonly<{ [K in KeyCode]: number }>;
type KeyCode = (typeof KEY_CODES)[keyof typeof KEY_CODES];

const isTrackedKeyCode = (code: string): code is KeyCode =>
  (Object.values(KEY_CODES) as string[]).includes(code);

export const registerForKeyEvents = (): Dynamic<number> => {
  // Raw key codes from keyup/keydown.
  const initialKeyEvent = (e: KeyboardEvent) => !e.repeat;
  const keyup = pipe(
    filter(initialKeyEvent),
    mapEvt(({ code }: KeyboardEvent) => code),
    filter(isTrackedKeyCode),
  )(fromDOMEvent(document, "keyup"));
  const keydown = pipe(
    filter(initialKeyEvent),
    mapEvt(({ code }: KeyboardEvent) => code),
    filter(isTrackedKeyCode),
  )(fromDOMEvent(document, "keydown"));

  // Transform raw key codes into functions that can set/remove the appropriate
  // flags.
  const keyupUpdate = mapEvt((code: KeyCode) => (prevMask: number) =>
    prevMask & ~KEY_FLAGS[code],
  )(keyup);
  const keydownUpdate = mapEvt((code: KeyCode) => (prevMask: number) =>
    prevMask | KEY_FLAGS[code],
  )(keydown);

  // Apply each flag update function, starting with the assumption that no keys
  // are being pressed.
  return foldDyn(
    (keysMask: number, transform: (prevMask: number) => number) =>
      transform(keysMask),
    NO_KEYS,
  )(merge(keyupUpdate, keydownUpdate));
};
