import { pipe } from "../frp";
import { Dynamic, foldDyn } from "../frp/Dynamic";
import { filter, fromDOMEvent, mapEvt, merge } from "../frp/Event";

// Character-based index for easily looking up values for a specific key name,
// as well as a numerical index for looking up the bit mask based on keyCode.
type Keymap = Readonly<KeyNameMap & KeyCodeMap>;

// Index is the key's name (eg. "w", "up", "enter").
type KeyNameMap = Readonly<
  {
    // For every key in keyCodes...
    [Key in keyof BaseKeyCodesMap]: Readonly<{
      // ...make sure the type of the keyCode is the specific type from that value
      // in the keyCodes base map (ie. `87` or `63` rather than `number`).
      keyCode: (BaseKeyCodesMap)[Key];
      flag: number;
    }>
  }
>;
// Index is the key's keyCode (eg. 87, 63).
type KeyCodeMap = Readonly<
  {
    // KeyCode is the value of each key found in the keyCodes base map (get the
    // keys of the map, and for each key grab the value via `map[key]`).
    [KeyCode in (BaseKeyCodesMap)[keyof BaseKeyCodesMap]]: Readonly<{
      keyName: {
        // For each key in keyCodes (ie. the key name), check if the type of the
        // value at that key matches the current KeyCode. If so, use it, if not,
        // assign it as `never`. Then grab all the types from this set of types
        // (using the union its own keys as an accessor), which will return
        // anything that's not a `never`. In other words, grab any key whose value
        // is the current KeyCode (there should only be one).
        [K in keyof BaseKeyCodesMap]: (BaseKeyCodesMap)[K] extends KeyCode
          ? K
          : never
      }[keyof BaseKeyCodesMap];
      flag: number;
    }>
  }
>;

// The flag value for no keys being pressed.
const NO_KEYS = 0;

// A simple mapping of key name to key code. Will be mapped over later to
// provide a mapping with additional info.
//
// Giving the keyCodes a specific type corresponding to their numerical value is
// crucial for subsequent type-checking functionality of the resultant mapped
// `keymap`. Without specifying a numerical type, TypeScript will infer the type
// to be a generic `number`, which will prevent advanced type-level wizardry.
// tslint:disable:object-literal-sort-keys
const codesByName = Object.freeze({
  w: 87 as 87,
  a: 65 as 65,
  s: 83 as 83,
  d: 68 as 68,
});
// tslint:enable:object-literal-sort-keys

// Convenience assignment.
type BaseKeyCodesMap = typeof codesByName;

// The final keymap with full info. Use to access key name to key code mapping
// and vice versa, as well as keep track of the bit flag values for each key.
export const keymap: Keymap = Object.freeze(
  (Object.keys(codesByName) as Array<keyof BaseKeyCodesMap>).reduce(
    (out, key, index) => ({
      ...out,
      [key]: Object.freeze({ keyCode: codesByName[key], flag: 1 << index }), // access by letter
      [codesByName[key]]: Object.freeze({ keyName: key, flag: 1 << index }), // access by keyCode
    }),
    {} as Keymap,
  ),
);

const isTrackedKeyCode = (
  keyCode: number | string,
): keyCode is {
  // Enumerate the keys from keymap, with `never` if they aren't numeric. Then
  // using the accessor syntax with the same list of keys results in only the
  // ones that aren't `never` (ie. numeric keys only).
  [K in keyof Keymap]: K extends number ? K : never
}[keyof Keymap] =>
  // Use .toString() since object keys will always be converted to strings when
  // using for access or assignment, so Object.keys always returns strings,
  // requiring our number accessor to be converted in order to match.
  Object.keys(keymap)
    .filter(key => !isNaN(Number(key))) // only check against numeric keys
    .includes(keyCode.toString());

const isTrackedKeyName = (
  keyCode: string,
): keyCode is {
  // Enumerate the keys from keymap, with `never` if they aren't string-based.
  // Then using the accessor syntax with the same list of keys results in only
  // the ones that aren't `never` (ie. string-based keys only).
  [K in keyof Keymap]: K extends string ? K : never
}[keyof Keymap] =>
  Object.keys(keymap)
    .filter(key => isNaN(Number(key))) // only check against non-numeric keys
    .includes(keyCode.toString());

export const keyCodes = Object.keys(keymap)
  .map(key => Number(key))
  .filter(isTrackedKeyCode);

export const keyNames = Object.keys(keymap).filter(isTrackedKeyName);

export const isPressed = (keyOrKeyCode: keyof Keymap, keyMask: number) =>
  !!(keyMask & keymap[keyOrKeyCode].flag);

export const registerForKeyEvents = (): Dynamic<number> => {
  // Raw key codes from keyup/keydown.
  const initialKeyEvent = (e: KeyboardEvent) => !e.repeat;
  const keyup = pipe(
    filter(initialKeyEvent),
    mapEvt(({ keyCode }: KeyboardEvent) => keyCode),
    filter(isTrackedKeyCode),
  )(fromDOMEvent(document, "keyup"));
  const keydown = pipe(
    filter(initialKeyEvent),
    mapEvt(({ keyCode }: KeyboardEvent) => keyCode),
    filter(isTrackedKeyCode),
  )(fromDOMEvent(document, "keydown"));

  // Transform raw key codes into functions that can set/remove the appropriate
  // flags.
  const keyupUpdate = mapEvt((keyCode: number) => (prev: number) =>
    isTrackedKeyCode(keyCode) ? prev & ~keymap[keyCode].flag : prev,
  )(keyup);
  const keydownUpdate = mapEvt((keyCode: number) => (prev: number) =>
    isTrackedKeyCode(keyCode) ? prev | keymap[keyCode].flag : prev,
  )(keydown);

  // Apply each flag update function, starting with the assumption that no keys
  // are being pressed.
  return foldDyn(
    (keysPressed: number, transform: (prev: number) => number) =>
      transform(keysPressed),
    NO_KEYS,
  )(merge(keyupUpdate, keydownUpdate));
};
