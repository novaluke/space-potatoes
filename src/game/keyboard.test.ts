import { isPressed, keyCodes, keymap, registerForKeyEvents } from "./keyboard";

const hasDuplicates = <T>(arr: T[]) => {
  const step = (knownValues: T[], [head, ...tail]: T[]): boolean => {
    if (head === undefined) return false;
    if (knownValues.includes(head)) return true;
    return step([...knownValues, head], tail);
  };
  return step([], arr);
};

describe("hasDuplicates test helper", () => {
  it("returns true if the array has duplicates", () => {
    expect(hasDuplicates([0, 1, 1, 2, 3])).toBe(true);
  });

  it("returns false if the array has no duplicates", () => {
    expect(hasDuplicates([1, 2, 3])).toBe(false);
  });

  it("returns false if the array is empty", () => {
    expect(hasDuplicates([])).toBe(false);
  });
});

describe("keyboard", () => {
  describe("keymap", () => {
    it("doesn't contain any duplicate keyCodes", () => {
      const keyCodesByKeyName: number[] = [];
      const keyCodesByKeyCode: number[] = [];
      Object.values(keymap).forEach(val =>
        "keyCode" in val
          ? keyCodesByKeyName.push(val.keyCode)
          : keyCodesByKeyCode.push(keymap[val.keyName].keyCode),
      );

      expect(hasDuplicates(keyCodesByKeyName)).toBe(false);
      expect(hasDuplicates(keyCodesByKeyCode)).toBe(false);
    });

    it("contains a code-to-name mapping for each name-to-code mapping", () => {
      Object.values(keymap).forEach(val => {
        if ("keyCode" in val) {
          // Values from the name-to-code mapping.
          const { keyCode, flag } = val;
          // Values from the code-to-name mapping.
          const { keyName, flag: matchingFlag } = keymap[keyCode];
          // Check that both mappings have the same flag.
          expect(flag).toBe(matchingFlag);
          // Check that the code-to-name mapping has the same name as the
          // name-to-code mapping. However, since we can't easily map over the
          // keymap's keys (no index type, and heterogenous indices), we can't
          // just check that the code-to-name mapping contains the key for the
          // current value. Instead, the only option is to check that by *using*
          // that name we get the same result as the current value.
          expect(keymap[keyName]).toBe(val);
        }
      });
    });

    it("ensures the flags are unique binary mask flags", () => {
      const flags: number[] = [];
      Object.values(keymap).forEach(val => {
        // The flags will be duplicated between code-to-name and name-to-code
        // mappings, so only act on one half of them (name-to-code in this case).
        if ("keyCode" in val) flags.push(val.flag);
      });

      expect(hasDuplicates(flags)).toBe(false);
      flags.forEach(flag =>
        // This math equation checks if the flag is a power of two, which all
        // values must be if they are to work properly as a binary flag.
        expect((Math.log(flag) / Math.log(2)) % 1 === 0).toBe(true),
      );
    });
  });

  // TODO
  // keyCodes and keyNames are too simple (and tricky to test) to bother testing
  // at this point, but might be good to get around to at some point.

  describe("isPressed", () => {
    it("it returns true when the key or keyCode is set in the bit mask", () => {
      const keyName = "w";
      const { keyCode, flag } = keymap[keyName];
      const mask = flag | (flag << 1); // flag is set AND something one bit over is set

      expect(isPressed(keyName, mask)).toBe(true);
      expect(isPressed(keyCode, mask)).toBe(true);
    });

    it("returns true when the key or keyCode is not set in the bit mask", () => {
      const keyName = "w";
      const { keyCode, flag } = keymap[keyName];
      const mask = flag << 1; // something one bit over is set, but NOT flag itself

      expect(isPressed(keyName, mask)).toBe(false);
      expect(isPressed(keyCode, mask)).toBe(false);
    });
  });

  describe("registerForKeyEvents", () => {
    it("starts with all keys toggled off", () => {
      const pressedKeys = registerForKeyEvents();
      keyCodes
        .map(code => keymap[code])
        .forEach(({ flag }) => expect(flag & pressedKeys.value).toBeFalsy());
    });

    describe("on keydown and keyup", () => {
      it("sets and clears keys' flags on keydown and keyup", () => {
        const keyName = "w";
        const { keyCode, flag } = keymap[keyName];
        const pressedKeys = registerForKeyEvents();
        const downEvent = new KeyboardEvent("keydown", { keyCode } as any);
        const upEvent = new KeyboardEvent("keyup", { keyCode } as any);

        document.dispatchEvent(downEvent);
        expect(flag & pressedKeys.value).toBeTruthy();

        document.dispatchEvent(upEvent);
        expect(flag & pressedKeys.value).toBeFalsy();
      });

      it("doesn't modify any other key's flags on keydown or keyup", () => {
        const keyName = "a";
        const otherKeyName = "w";
        const { keyCode, flag } = keymap[keyName];
        const { keyCode: otherKeyCode } = keymap[otherKeyName];
        const pressedKeys = registerForKeyEvents();
        const downEvent = new KeyboardEvent("keydown", {
          keyCode,
        } as any);
        const otherDownEvent = new KeyboardEvent("keydown", {
          keyCode: otherKeyCode,
        } as any);
        const otherUpEvent = new KeyboardEvent("keyup", {
          keyCode: otherKeyCode,
        } as any);

        document.dispatchEvent(otherDownEvent);
        expect(flag & pressedKeys.value).toBeFalsy();

        // Not much point checking that keyup doesn't change an already up key, so
        // set it to down to check that a keyup doesn't change a keydown, which is
        // more relevant.
        document.dispatchEvent(downEvent);
        document.dispatchEvent(otherUpEvent);
        expect(flag & pressedKeys.value).toBeTruthy();
      });
    });

    it("does nothing when a key is released without having been set", () => {
      const keyName = "w";
      const { keyCode } = keymap[keyName];
      const pressedKeys = registerForKeyEvents();
      const upEvent = new KeyboardEvent("keyup", { keyCode } as any);
      const beforeValue = pressedKeys.value;

      document.dispatchEvent(upEvent);
      expect(pressedKeys.value).toBe(beforeValue);
    });
  });
});
