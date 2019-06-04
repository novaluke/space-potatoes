import { restoreRAF, step, useMockRAF } from "../../test/mockRAF";
import { mkDyn } from "./Dynamic";
import {
  attach,
  filter,
  fromAnimationFrame,
  fromDOMEvent,
  mapEvt,
  merge,
  mkEvent,
  throttle,
} from "./Event";

describe("Event", () => {
  describe("unsubscribing", () => {
    // TODO word this better
    it("doesn't fire events once unsubscribed", () => {
      const [event, emit] = mkEvent();
      const sub = jest.fn();
      event.subscribe(sub);

      emit({});
      expect(sub).toHaveBeenCalledTimes(1);

      event.unsubscribe(sub);
      emit({});
      expect(sub).toHaveBeenCalledTimes(1);
    });
  });

  describe("fromAnimationFrame", () => {
    beforeEach(() => useMockRAF());
    afterEach(() => restoreRAF());

    it("emits the delta since the last animation frame", () => {
      const event = fromAnimationFrame();
      const sub = jest.fn();
      const delta = 1337;

      event.subscribe(sub);
      step();
      step(1, delta);

      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenCalledWith(delta);
    });
  });

  describe("fromDOMEvent", () => {
    it("emits whenever the DOM event for the element fires", () => {
      const ele = document.createElement("button");
      const event = fromDOMEvent(ele, "click");
      const sub = jest.fn();
      const domEvent = new Event("click");
      event.subscribe(sub);

      ele.dispatchEvent(domEvent);
      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenLastCalledWith(domEvent);

      // Check that it doesn't emit for other event types.
      ele.dispatchEvent(new Event("keydown"));
      expect(sub).toHaveBeenCalledTimes(1);
    });
  });

  describe("map", () => {
    it("maps each event using the map function", () => {
      const transform = (val: string) => val.toUpperCase();
      const inputs = ["Hello World!", "Space potatoes is the best!"];
      // Make sure the transform function does make a difference, to avoid false
      // positives.
      expect(inputs.map(transform)).not.toEqual(inputs);
      const outputs: string[] = [];
      const [event, emit] = mkEvent<string>();
      mapEvt(transform)(event).subscribe(val => outputs.push(val));

      inputs.forEach(emit);
      expect(outputs).toEqual(inputs.map(transform));
    });

    it("runs the transform once per event, regardless of number of subscribers", () => {
      const transform = jest.fn();
      const [event, emit] = mkEvent();

      const mappedEvent = mapEvt(transform)(event);
      mappedEvent.subscribe(() => null);
      mappedEvent.subscribe(() => null);
      expect(transform).not.toHaveBeenCalled();

      emit({});
      expect(transform).toHaveBeenCalledTimes(1);
    });
  });

  describe("merge", () => {
    it("emits whenever any of the source events emit", () => {
      const sources = [mkEvent<number>(), mkEvent<number>(), mkEvent<number>()];
      const expected = [0, 2, 1];
      const outputs: number[] = [];
      const merged = merge(...sources.map(([event, _]) => event));
      merged.subscribe(val => outputs.push(val));

      // sources[any][1] === emit for that source
      expected.forEach(n => sources[n][1](n));

      expect(outputs).toEqual(expected);
    });
  });

  describe("filter", () => {
    it("only emits when the predicate returns true", () => {
      const willPass = "Long enough string";
      const willNotPass = "foo";
      const sub = jest.fn();
      const [event, emit] = mkEvent<string>();
      filter((val: string) => val.length > 3)(event).subscribe(sub);

      emit(willPass);
      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenCalledWith(willPass);

      emit(willNotPass);
      expect(sub).toHaveBeenCalledTimes(1);
    });
  });

  describe("attach", () => {
    it("emits [dynamic.value, event value] when the event emits", () => {
      const dynValues = ["Hello World!", "Space potatoes is the best!"];
      const evtValues = [0, 1, 2];
      const [event, emit] = mkEvent<number>();
      const [dyn, update] = mkDyn<string>(dynValues[0]);
      let emitted: [string, number];
      attach(dyn, event).subscribe(val => (emitted = val));

      expect(emitted!).not.toBeDefined();

      emit(evtValues[0]);
      expect(emitted!).toEqual([dynValues[0], evtValues[0]]);

      emit(evtValues[1]);
      expect(emitted!).toEqual([dynValues[0], evtValues[1]]);

      update(dynValues[1]);
      emit(evtValues[2]);
      expect(emitted!).toEqual([dynValues[1], evtValues[2]]);
    });

    it("doesn't emit when the dynamic changes", () => {
      const [event] = mkEvent();
      const [dyn, update] = mkDyn(0);
      let emitCount = 0;
      attach(dyn, event).subscribe(() => (emitCount += 1));

      expect(emitCount).toBe(0);

      update(1);
      expect(emitCount).toBe(0);
    });
  });

  describe("throttle", () => {
    let origNow: typeof performance.now;
    let now: number;
    beforeEach(() => {
      now = 0;
      origNow = performance.now;
      performance.now = jest.fn(() => now);
    });
    afterEach(() => {
      performance.now = origNow;
    });
    it("lets the first emitted value through", () => {
      const [event, emit] = mkEvent();
      const sub = jest.fn();
      const value = "Space Potatoes";
      throttle(1000)(event).subscribe(sub);

      emit(value);
      expect(sub).toHaveBeenCalledWith(value);
    });

    describe("after an event is emitted", () => {
      it("filters out subsequent events within the given interval", () => {
        const interval = 500;
        const [event, emit] = mkEvent();
        const sub = jest.fn();
        const values = [
          "Hello World!",
          "Space potatoes is the best!",
          "And so is FRP!",
          "The end.",
          "I will not be emitted",
        ];
        throttle(interval)(event).subscribe(sub);

        emit(values[0]);
        emit(values[1]);
        expect(sub).not.toHaveBeenCalledWith(values[1]);

        now += interval - 1;
        emit(values[2]);
        expect(sub).not.toHaveBeenCalledWith(values[2]);

        now += 1;
        emit(values[3]);
        expect(sub).not.toHaveBeenCalledWith(values[1]);
        expect(sub).not.toHaveBeenCalledWith(values[2]);
        expect(sub).toHaveBeenCalledWith(values[3]);
        expect(sub).not.toHaveBeenCalledWith(values[4]);
      });
    });
  });
});
