export { fromAnimationFrame } from "./Event";

// Workaround for not being able to re-export types with the --isolatedModules
// flag enabled.
// eslint-disable-next-line import/first
import { Event } from "./Event";
export type Event<T> = Event<T>;
