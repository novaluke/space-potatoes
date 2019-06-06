import {
  Dynamic,
  Event,
  foldDyn,
  mapDyn,
  mapEvt,
  merge,
  pipe,
  splitDyn,
  Update as BaseUpdate,
} from "../frp";
import { switchDyn } from "../frp/Dynamic";
import { mkEvent } from "../frp/Event";
import { Bullet, mkBullet } from "./Bullet";

type State = [Array<Dynamic<Bullet>>, Array<Event<{}>>];
type Init = Parameters<typeof mkBullet>[0];
type Update = BaseUpdate<State>;

const addBullet = (
  init: Init,
  bounds: [number, number],
  fpsDelta: Event<number>,
): Update => ([bullets, endEvents]) => {
  const output = mkBullet(init, bounds, fpsDelta);
  return [
    [...bullets, output[0]],
    // [...endEvents, mapEvt(() => endEvents.length)(output[1])],
    [...endEvents, output[1]],
  ];
};

const deleteBullet = (index: number): Update => ([bullets, endEvents]) => [
  bullets.slice(0, index).concat(bullets.slice(index + 1)),
  endEvents.slice(0, index).concat(endEvents.slice(index + 1)),
];

// Self-managing list of bullets: occurrences of `createEvent` add a bullets,
// and when their lifetime is complete (ie. they've been on the screen for their
// full duration) they will be automatically removed.
export const bulletList = (
  bounds: [number, number],
  fpsDelta: Event<number>,
  createEvent: Event<Init>,
  deleteEvent: Event<number>,
): Dynamic<Array<Dynamic<Bullet>>> => {
  // Required to circumvent the recursive dependency of the explosions list
  // depending on the events coming out of the explosions it creates.
  const [bulletEnd, emitBulletEnd] = mkEvent<number>();
  const [bullets, endEvents] = pipe(
    foldDyn((state: State, update: Update) => update(state), [[], []] as State),
    splitDyn,
  )(
    merge(
      mapEvt<Init, Update>(init => addBullet(init, bounds, fpsDelta))(
        createEvent,
      ),
      mapEvt<number, Update>(deleteBullet)(bulletEnd),
      mapEvt<number, Update>(deleteBullet)(deleteEvent),
    ),
  );

  // Connect explosion end events back up into the prepared event stream.
  pipe(
    mapDyn((x: Array<Event<{}>>) =>
      x.map((e, index) => mapEvt(() => index)(e)),
    ),
    mapDyn((x: Array<Event<number>>) => merge(...x)),
    switchDyn,
  )(endEvents).subscribe(emitBulletEnd);

  return bullets;
};
