export {
  constDyn,
  concatDyn,
  splitDyn,
  foldDyn,
  mapDyn,
  holdDyn,
  join,
} from "./Dynamic";
export {
  attach,
  tag,
  mapEvtMaybe,
  never,
  merge,
  filter,
  fromAnimationFrame,
  fromDOMEvent,
  mapEvt,
} from "./Event";
export * from "./pipe";

export type Update<T> = (state: T) => T;

// Workaround for not being able to re-export types with the --isolatedModules
// flag enabled.
// eslint-disable-next-line import/first
import { Event } from "./Event";
export type Event<T> = Event<T>;
// eslint-disable-next-line import/first
import { Dynamic } from "./Dynamic";
export type Dynamic<T> = Dynamic<T>;
