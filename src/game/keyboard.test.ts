import { KEY_CODES, KEY_FLAGS, registerForKeyEvents } from "./keyboard";

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
  describe("KEY_CODES", () => {
    it("doesn't contain any duplicate codes", () => {
      expect(hasDuplicates(Object.values(KEY_CODES))).toBe(false);
    });
  });

  describe("KEY_FLAGS", () => {
    it("contains flags for the codes in KEY_CODES", () => {
      expect(Object.keys(KEY_FLAGS)).toEqual(Object.values(KEY_CODES));
    });

    it("does not contain any duplicate flag values", () => {
      expect(hasDuplicates(Object.values(KEY_FLAGS))).toBe(false);
    });

    it("contains only valid bit flag values", () => {
      Object.values(KEY_FLAGS).forEach(flag =>
        // This math equation checks if the flag is a power of two, which all
        // values must be if they are to work properly as a binary flag.
        expect((Math.log(flag) / Math.log(2)) % 1 === 0).toBeTruthy(),
      );
    });
  });

  describe("registerForKeyEvents", () => {
    let keysPressed: ReturnType<typeof registerForKeyEvents>;
    beforeEach(() => (keysPressed = registerForKeyEvents()));

    it("starts with all keys toggled off", () => {
      Object.values(KEY_FLAGS).forEach(flag =>
        expect(flag & keysPressed.value).toBeFalsy(),
      );
    });

    describe("on keydown and keyup", () => {
      it("sets and clears keys' flags on keydown and keyup", () => {
        const code = KEY_CODES.w;
        const flag = KEY_FLAGS[code];
        const downEvent = new KeyboardEvent("keydown", { code });
        const upEvent = new KeyboardEvent("keyup", { code });

        document.dispatchEvent(downEvent);
        expect(flag & keysPressed.value).toBeTruthy();

        document.dispatchEvent(upEvent);
        expect(flag & keysPressed.value).toBeFalsy();
      });

      it("doesn't modify any other key's flags on keydown or keyup", () => {
        const code = KEY_CODES.w;
        const otherCode = KEY_CODES.a;
        const otherFlag = KEY_FLAGS[otherCode];

        const downEvent = new KeyboardEvent("keydown", { code });
        const upEvent = new KeyboardEvent("keyup", { code });
        const otherDownEvent = new KeyboardEvent("keydown", {
          code: otherCode,
        });

        // Check that a keydown doesn't change any other "keyup"s to "keydown"s.
        document.dispatchEvent(downEvent);
        expect(otherFlag & keysPressed.value).toBeFalsy();

        // Not much point checking that keyup doesn't change an already up key,
        // so set the "other key" to down to check that a keyup doesn't change a
        // keydown, which is more relevant.
        document.dispatchEvent(otherDownEvent);
        document.dispatchEvent(upEvent);
        expect(otherFlag & keysPressed.value).toBeTruthy();
      });
    });

    it("does nothing when a key is released without having been set", () => {
      const code = KEY_CODES.w;
      const upEvent = new KeyboardEvent("keyup", { code });
      const beforeValue = keysPressed.value;

      document.dispatchEvent(upEvent);
      expect(keysPressed.value).toBe(beforeValue);
    });
  });
});
