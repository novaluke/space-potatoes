import {
  Dynamic,
  Event,
  foldDyn,
  mapDyn,
  mapEvt,
  merge,
  mkEvent,
  pipe,
  splitDyn,
  switchDyn,
  Update as BaseUpdate,
} from "../frp";
import { Asteroid, mkAsteroid } from "./Asteroid";

type State = Array<Dynamic<Asteroid>>;
type Init = Parameters<typeof mkAsteroid>[0];
type Update = BaseUpdate<State>;

const addAsteroid = (
  init: Init,
  fpsDelta: Event<number>,
): Update => asteroids => {
  return [...asteroids, mkAsteroid(init, fpsDelta)];
};

const deleteAsteroid = (index: number): Update => asteroids =>
  asteroids.slice(0, index).concat(asteroids.slice(index + 1));

// Self-managing list of asteroids: occurrences of `createEvent` add a asteroids,
// and when their lifetime is complete (ie. they've been on the screen for their
// full duration) they will be automatically removed.
export const asteroidList = (
  initialAsteroids: State,
  bounds: [number, number],
  fpsDelta: Event<number>,
  deleteEvent: Event<number>,
): Dynamic<Array<Dynamic<Asteroid>>> => {
  // Required to circumvent the recursive dependency of the explosions list
  // depending on the events coming out of the explosions it creates.
  const asteroids = foldDyn(
    (state: State, update: Update) => update(state),
    initialAsteroids,
  )(
    merge(
      // mapEvt<Init, Update>(init => addAsteroid(init, bounds, fpsDelta))(
      //   createEvent,
      // ),
      mapEvt<number, Update>(deleteAsteroid)(deleteEvent),
    ),
  );

  // // Connect explosion end events back up into the prepared event stream.
  // pipe(
  //   mapDyn((x: Array<Event<{}>>) =>
  //     x.map((e, index) => mapEvt(() => index)(e)),
  //   ),
  //   mapDyn((x: Array<Event<number>>) => merge(...x)),
  //   switchDyn,
  // )(endEvents).subscribe(emitAsteroidEnd);

  return asteroids;
};
