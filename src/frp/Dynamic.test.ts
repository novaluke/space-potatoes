import { foldDyn, mapDyn, mkDyn } from "./Dynamic";
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
    expect(foldDyn(() => null, initialValue)(mkEvent()[0]).value).toBe(
      initialValue,
    );
  });

  it("runs the reducer over the event values, using the given initial value", () => {
    const initialValue = 0;
    const values = [1, 2, 3];
    const [event, emit] = mkEvent<number>();
    const reducer = (acc: number, val: number) => acc + val;
    let output;

    foldDyn(reducer, initialValue)(event).subscribe(val => (output = val));
    values.forEach(val => emit(val));

    expect(output).toEqual(values.reduce(reducer, initialValue));
  });

  it("runs the reducer once per event, regardless of number of subscribers", () => {
    const reducer = jest.fn();
    const [event, emit] = mkEvent();

    const dyn = foldDyn(reducer, null)(event);
    dyn.subscribe(() => null);
    dyn.subscribe(() => null);

    emit({});
    expect(reducer).toHaveBeenCalledTimes(1);

    dyn.subscribe(() => null);
    emit({});
    expect(reducer).toHaveBeenCalledTimes(2);
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
    const [dynamic, update] = mkDyn(inputs[0]);
    mapDyn(transform)(dynamic).subscribe(val => outputs.push(val));

    inputs.forEach(update);
    expect(outputs).toEqual(inputs.map(transform));
  });

  it("maps its value, even when there are no subscribers", () => {
    const transform = (val: string) => val.toUpperCase();
    const inputs = ["Hello World!", "Space potatoes is the best!"];
    // Make sure the transform function does make a difference, to avoid false
    // positives.
    expect(inputs.map(transform)).not.toEqual(inputs);
    const [dynamic, update] = mkDyn(inputs[0]);

    const mappedDyn = mapDyn(transform)(dynamic);
    expect(mappedDyn.value).toEqual(transform(inputs[0]));

    update(inputs[1]);
    expect(mappedDyn.value).toEqual(transform(inputs[1]));
  });

  it("runs the transform once per value, regardless of number of subscribers", () => {
    const transform = jest.fn();
    const [dynamic, update] = mkDyn(null);

    const mappedDyn = mapDyn(transform)(dynamic);
    mappedDyn.subscribe(() => null);
    mappedDyn.subscribe(() => null);

    // First call is for mapping the initial value.
    expect(transform).toHaveBeenCalledTimes(1);

    update(null);
    // One call for the initial value, a second call for the updated value.
    expect(transform).toHaveBeenCalledTimes(2);
  });
});
