export { foldDyn, mapDyn } from "./Dynamic";
export { fromAnimationFrame, fromDOMEvent, mapEvt } from "./Event";

// Workaround for not being able to re-export types with the --isolatedModules
// flag enabled.
// eslint-disable-next-line import/first
import { Event } from "./Event";
export type Event<T> = Event<T>;
// eslint-disable-next-line import/first
import { Dynamic } from "./Dynamic";
export type Dynamic<T> = Dynamic<T>;
