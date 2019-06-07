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
import { Explosion, mkExplosion } from "./Explosion";

type State = [Array<Dynamic<Explosion>>, Array<Event<number>>];
type Init = Parameters<typeof mkExplosion>[0];
type Update = BaseUpdate<State>;

const addExplosion = (init: Init, fpsDelta: Event<number>): Update => ([
  explosions,
  endEvents,
]) => {
  const output = mkExplosion(init, fpsDelta);
  return [
    [...explosions, output[0]],
    [...endEvents, mapEvt(() => endEvents.length)(output[1])],
  ];
};

const deleteExplosion = (index: number): Update => ([
  explosions,
  endEvents,
]) => [
  explosions.slice(0, index).concat(explosions.slice(index + 1)),
  endEvents.slice(0, index).concat(endEvents.slice(index + 1)),
];

// Self-managing list of explosions: occurrences of `createEvent` add an
// explosion, and when their lifetime is complete (ie. their animation is over)
// they will be automatically removed.
export const explosionList = (
  fpsDelta: Event<number>,
  createEvent: Event<Init>,
): Dynamic<Array<Dynamic<Explosion>>> => {
  // Required to circumvent the recursive dependency of the explosions list
  // depending on the events coming out of the explosions it creates.
  const [explosionEnd, emitExplosionEnd] = mkEvent<number>();
  const [explosions, endEvents] = pipe(
    foldDyn((state: State, update: Update) => update(state), [[], []] as State),
    splitDyn,
  )(
    merge(
      mapEvt<Init, Update>(init => addExplosion(init, fpsDelta))(createEvent),
      mapEvt<number, Update>(deleteExplosion)(explosionEnd),
    ),
  );

  // Connect explosion end events back up into the prepared event stream.
  pipe(
    mapDyn((x: Array<Event<number>>) => merge(...x)),
    switchDyn,
  )(endEvents).subscribe(emitExplosionEnd);

  return explosions;
};
