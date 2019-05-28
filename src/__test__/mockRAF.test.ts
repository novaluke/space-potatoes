import { cancel, now, restoreRAF, step, useMockRAF } from "../../test/mockRAF";

const originalRequestAnimationFrame = requestAnimationFrame;

describe("mockRAF", () => {
  beforeEach(() => useMockRAF());
  afterEach(() => restoreRAF());

  describe("mockRAF", () => {
    it("throws an error if mockRAF is called more than once", () => {
      expect(() => useMockRAF()).toThrowError();
    });
    it("does not throw an error if called again after restoreRAF is used", () => {
      restoreRAF();
      expect(() => useMockRAF()).not.toThrowError();
    });
    describe("config object", () => {
      beforeEach(() => restoreRAF());

      it("sets the initial now value", () => {
        const initialNow = 1337;

        useMockRAF({ initialNow });

        expect(now).toEqual(initialNow);
      });

      it("sets the default delta value", () => {
        const delta = 1337;

        useMockRAF({ delta });
        const originalNow = now;

        step();
        expect(now).toEqual(originalNow + delta);
      });
    });
  });

  describe("when step is called", () => {
    it("runs registered callbacks in order of registration", () => {
      const orderCalled: number[] = [];
      const fns = [
        jest.fn(() => orderCalled.push(0)),
        jest.fn(() => orderCalled.push(1)),
      ];
      fns.forEach(requestAnimationFrame);

      step();

      expect(orderCalled).toEqual([0, 1]);
    });

    it("runs the number of frames passed in", () => {
      const outputs: number[] = [];
      // Incrementally logs numbers to outputs on each new animation frame.
      const logIncrementally = (val: number) => (_: number) => {
        outputs.push(val);
        requestAnimationFrame(logIncrementally(val + 1));
      };
      requestAnimationFrame(logIncrementally(0));

      step(3);

      expect(outputs).toEqual([0, 1, 2]);
    });

    it("increments the current timestamp by 1 frame at 60fps", () => {
      const originalNow = now;

      step();
      expect(now).toEqual(originalNow + 1000 / 60);
    });

    describe("when a timeDelta is given", () => {
      it("increments the current timestamp by the delta", () => {
        const delta = 1000;
        const originalNow = now;

        step(1, delta);

        expect(now).toEqual(originalNow + delta);
      });
    });

    it("calls the callbacks with the next `now` value", () => {
      const callback: any = jest.fn(() => requestAnimationFrame(callback));
      requestAnimationFrame(callback);

      step();
      expect(callback.mock.calls[0][0]).toEqual(now);

      step();
      expect(callback.mock.calls[1][0]).toEqual(now);
    });
  });

  describe("cancel", () => {
    it("prevents the callback from being run", () => {
      let id: number;
      const callback: () => void = jest.fn(
        () => (id = requestAnimationFrame(callback)),
      );
      id = requestAnimationFrame(callback);

      // Verify that the callback will indeed keep being called if not
      // cancelled, to prevent false positives.
      step();
      step();
      expect(callback).toHaveBeenCalledTimes(2);

      cancel(id);
      step();
      expect(callback).toHaveBeenCalledTimes(2);

      step();
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("restoreRAF", () => {
    it("cancels all callbacks", () => {
      const fns: Array<() => void> = [
        jest.fn(() => requestAnimationFrame(fns[0])),
        jest.fn(() => requestAnimationFrame(fns[1])),
      ];
      fns.forEach(requestAnimationFrame);

      // Verify that the callbacks will indeed keep being called if not
      // cancelled, to prevent false positives.
      step();
      step();
      fns.forEach(fn => expect(fn).toHaveBeenCalledTimes(2));

      restoreRAF();
      step();
      fns.forEach(fn => expect(fn).toHaveBeenCalledTimes(2));
    });

    it("resets `now` to 0", () => {
      step();
      expect(now).not.toBe(0);

      restoreRAF();
      expect(now).toBe(0);
    });

    it("restores the original requestAnimationFrame", () => {
      expect(requestAnimationFrame).not.toBe(originalRequestAnimationFrame);

      restoreRAF();

      expect(requestAnimationFrame).toBe(originalRequestAnimationFrame);
    });
  });
});
