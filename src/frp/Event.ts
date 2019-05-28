type Subscriber<T> = (val: T) => void;

export interface Event<T> {
  subscribe: (fn: (val: T) => void) => void;
}

// Emits at every animation frame with the time delta since the last event.
export const fromAnimationFrame = (): Event<number> => {
  const [event, emit] = mkEvent<number>();
  const onFrame = (lastTimestamp: number) => (timestamp: number) => {
    emit(timestamp - lastTimestamp);
    requestAnimationFrame(onFrame(timestamp));
  };
  // On the first animation frame only the current timestamp is available,
  // making it impossible to calculate the delta, so the first animation frame
  // has to be handled specially.
  requestAnimationFrame(timestamp => requestAnimationFrame(onFrame(timestamp)));
  return event;
};

export const mkEvent = <T>(): [Event<T>, (val: T) => void] => {
  const subs: Array<Subscriber<T>> = [];
  const event: Event<T> = {
    subscribe: sub => subs.push(sub),
  };
  const emit = (val: T) => subs.forEach(sub => sub(val));
  return [event, emit];
};

// Type of `event` (`K`) copy+pasted from the type of `addEventListener` on
// `HTMLElement`, which appears to be the same type used across all elements.
export const fromDOMEvent = <K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  eventType: K,
): Event<HTMLElementEventMap[K]> => {
  const [event, emit] = mkEvent<HTMLElementEventMap[K]>();
  element.addEventListener(eventType, emit);
  return event;
};
