import {
  Dynamic,
  Event,
  foldDyn,
  mapEvt,
  merge,
  Update as BaseUpdate,
} from "../frp";
import { Asteroid } from "./Asteroid";

type State = Array<Dynamic<Asteroid>>;
type Update = BaseUpdate<State>;

const deleteAsteroid = (index: number): Update => asteroids =>
  asteroids.slice(0, index).concat(asteroids.slice(index + 1));

// Self-managing list of asteroids: occurrences of `createEvent` add a asteroids,
// and when their lifetime is complete (ie. they've been on the screen for their
// full duration) they will be automatically removed.
export const asteroidList = (
  initialAsteroids: State,
  deleteEvent: Event<number>,
): Dynamic<Array<Dynamic<Asteroid>>> => {
  const asteroids = foldDyn(
    (state: State, update: Update) => update(state),
    initialAsteroids,
  )(merge(mapEvt<number, Update>(deleteAsteroid)(deleteEvent)));

  return asteroids;
};
