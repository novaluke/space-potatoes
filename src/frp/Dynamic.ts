import { Event, mkEvent } from "./Event";

export interface Dynamic<T> extends Event<T> {
  readonly value: T;
}

export const foldDyn = <A, B>(
  reducer: (acc: B, event: A) => B,
  initial: B,
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
  const [{ subscribe }, emit] = mkEvent<T>();
  const update = (newVal: T) => {
    value = newVal;
    emit(value);
  };
  const dynamic: Dynamic<T> = {
    subscribe,
    get value() {
      return value;
    },
  };
  return [dynamic, update];
};
