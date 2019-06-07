export {
  concatDyn,
  constDyn,
  foldDyn,
  holdDyn,
  join,
  mapDyn,
  splitDyn,
} from "./Dynamic";

export {
  attach,
  filter,
  fromAnimationFrame,
  fromDOMEvent,
  mapEvt,
  mapEvtMaybe,
  merge,
  never,
  tag,
} from "./Event";

export * from "./pipe";

export type Update<T> = (state: T) => T;

// Workaround for not being able to re-export types with the --isolatedModules
// flag enabled.
// eslint-disable-next-line import/first
import { Dynamic } from "./Dynamic";
export type Dynamic<T> = Dynamic<T>;
// eslint-disable-next-line import/first
import { Event } from "./Event";
export type Event<T> = Event<T>;
