import { foldDyn, mkDyn } from "./Dynamic";
import { mkEvent } from "./Event";

describe("base dynamic behavior", () => {
  it("has a value equal to the given initial value", () => {
    const initialValue = {};
    expect(mkDyn(initialValue)[0].value).toBe(initialValue);
  });

  it("emits new values when the update function is called", () => {
    const nextValue = {};
    const sub = jest.fn();
    const [dynamic, update] = mkDyn<null | {}>(null);
    dynamic.subscribe(sub);

    update(nextValue);

    expect(sub).toHaveBeenCalledWith(nextValue);
  });

  it("updates its value before notifying its subscribers", () => {
    const nextValue = {};
    let foundValue;
    const [dynamic, update] = mkDyn<null | {}>(null);
    // foundValue will be the old value if the value was updated *after*
    // calling the subscriber.
    const sub = jest.fn(() => (foundValue = dynamic.value));
    dynamic.subscribe(sub);

    update(nextValue);

    expect(foundValue).toBe(nextValue);
  });
});

describe("foldDyn", () => {
  it("sets its initial value", () => {
    const initialValue = {};
    expect(foldDyn(() => null, initialValue, mkEvent()[0]).value).toBe(
      initialValue,
    );
  });

  it("runs the reducer over the event values, using the given initial value", () => {
    const initialValue = 0;
    const values = [1, 2, 3];
    const [event, emit] = mkEvent<number>();
    const reducer = (acc: number, val: number) => acc + val;
    let output;

    foldDyn(reducer, initialValue, event).subscribe(val => (output = val));
    values.forEach(val => emit(val));

    expect(output).toEqual(values.reduce(reducer, initialValue));
  });

  it("runs the reducer once per event, regardless of number of subscribers", () => {
    const reducer = jest.fn();
    const [event, emit] = mkEvent();

    const dyn = foldDyn(reducer, null, event);
    dyn.subscribe(() => null);
    dyn.subscribe(() => null);

    emit({});
    expect(reducer).toHaveBeenCalledTimes(1);

    dyn.subscribe(() => null);
    emit({});
    expect(reducer).toHaveBeenCalledTimes(2);
  });
});
