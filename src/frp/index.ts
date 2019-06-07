export {
  concatDyn,
  constDyn,
  distributeMapOverDyn,
  foldDyn,
  holdDyn,
  join,
  mapDyn,
  splitDyn,
  switchDyn,
} from "./Dynamic";

export {
  attach,
  filter,
  fromAnimationFrame,
  fromDOMEvent,
  mapEvt,
  mapEvtMaybe,
  merge,
  mkEvent,
  never,
  tag,
  take,
  takeUntil,
  takeWhile,
  throttle,
} from "./Event";

export * from "./pipe";

export type Update<T> = (state: T) => T;

// Workaround for not being able to re-export types with the --isolatedModules
// flag enabled.
// eslint-disable-next-line import/first
import { Dynamic } from "./Dynamic";
export type Dynamic<T> = Dynamic<T>;
// eslint-disable-next-line import/first
import { Event, Subscriber } from "./Event";
export type Event<T> = Event<T>;
export type Subscriber<T> = Subscriber<T>;
