import { Dynamic } from "./Dynamic";
import { Event, mkEvent } from "./Event";
import { Update } from "./index";

export interface Dynamic<T> extends Event<T> {
  readonly value: T;
}

export const foldDyn = <A, B>(reducer: (acc: B, event: A) => B, initial: B) => (
  event: Event<A>,
): Dynamic<B> => {
  const [dynamic, update] = mkDyn(initial);
  event.subscribe(eventVal => {
    update(reducer(dynamic.value, eventVal));
  });
  return dynamic;
};

export const mkDyn = <T>(initial: T): [Dynamic<T>, (val: T) => void] => {
  let value = initial;
  const [{ subscribe, unsubscribe }, , emitThunk] = mkEvent<T>();
  const update = (newVal: T) => {
    value = newVal;
    // Use emitThunk to ensure that the latest value is always used, rather than
    // locking the value in at the time of the emit called (ie. subscribers
    // after the first might get stale values).
    emitThunk(() => value);
  };
  const dynamic: Dynamic<T> = {
    subscribe,
    unsubscribe,
    get value() {
      return value;
    },
  };
  return [dynamic, update];
};

export const mapDyn = <A, B>(transform: (val: A) => B) => (
  source: Dynamic<A>,
) => {
  const [dynamic, update] = mkDyn(transform(source.value));
  source.subscribe(val => update(transform(val)));
  return dynamic;
};

export const holdDyn = <T>(initialValue: T) => (source: Event<T>) => {
  const [dynamic, update] = mkDyn(initialValue);
  source.subscribe(update);
  return dynamic;
};

export const constDyn = <T>(val: T) => mkDyn(val)[0];

// WARNING: not tested!
type ExtractTupleGenerics<T> = {
  [K in keyof T]: T[K] extends Dynamic<infer G> ? G : never
};
type ExtractGeneric<T> = T extends Dynamic<infer G> ? G : never;
export const concatDyn = <T extends Array<Dynamic<any>>>(
  // tslint:disable-next-line:trailing-comma
  ...dynamics: T
): Dynamic<ExtractTupleGenerics<T>> => {
  const [dynamic, update] = mkDyn(dynamics.map(dyn => dyn.value));
  dynamics.forEach((dyn, index) => {
    dyn.subscribe(val => {
      const newDynValue = dynamic.value.slice();
      newDynValue.splice(index, 1, val);
      update(newDynValue);
    });
  });
  return dynamic as Dynamic<ExtractTupleGenerics<T>>;
};
export const splitDyn = <T extends any[]>(
  dyn: Dynamic<T>,
): { [K in keyof T]: Dynamic<T[K]> } => {
  const outputs = dyn.value.map(val => mkDyn(val));
  outputs.forEach(([_, update], index) =>
    dyn.subscribe(val => update(val[index])),
  );
  return (outputs.map(([dynamic, _]) => dynamic) as unknown) as {
    [K in keyof T]: Dynamic<T[K]>
  };
};
export const switchDyn = <T>(dyn: Dynamic<Event<T>>): Event<T> => {
  let oldEvent = dyn.value;
  const [event, emit] = mkEvent<T>();
  oldEvent.subscribe(emit);
  dyn.subscribe(newEvent => {
    oldEvent.unsubscribe(emit);
    oldEvent = newEvent;
    newEvent.subscribe(emit);
  });
  return event;
};
export const distributeMapOverDyn = <T extends Record<string, Dynamic<any>>>(
  dynMapping: T,
): Dynamic<{ [K in keyof T]: ExtractGeneric<T[K]> }> => {
  type State = { [K in keyof T]: ExtractGeneric<T[K]> };
  const initial = (Object.keys(dynMapping) as Array<keyof T>).reduce(
    (acc, key) => ({ ...acc, [key]: dynMapping[key].value }),
    {} as State,
  );
  const [updates, emitUpdate] = mkEvent<Update<State>>();
  Object.keys(dynMapping).forEach(key =>
    dynMapping[key].subscribe(val =>
      emitUpdate(prev => ({ ...prev, [key]: val })),
    ),
  );
  const dyn = foldDyn((state, update: Update<State>) => update(state), initial)(
    updates,
  );
  return dyn;
};
// WARNING: only partially tested!
export const join = <T>(outer: Dynamic<Dynamic<T>>): Dynamic<T> => {
  let oldInner = outer.value;
  const [dynamic, update] = mkDyn(oldInner.value);
  // When there is a new inner value, update the resultant dynamic.
  oldInner.subscribe(update);

  // When the outer dynamic updates, stop listening to the old inner dynamic,
  // subscribe to the new inner dynamic, and update+emit based on the new inner
  // dynamic's value.
  outer.subscribe(newInner => {
    oldInner.unsubscribe(update);
    oldInner = newInner;
    newInner.subscribe(update);
    update(newInner.value);
  });

  return dynamic;
};
