export function pipe<Args extends any[], A, B>(
  fn1: (...args: Args) => A,
  fn2: (val: A) => B,
): (...args: Args) => B;
export function pipe<Args extends any[], A, B, C>(
  fn1: (...args: Args) => A,
  fn2: (val: A) => B,
  fn3: (val: B) => C,
): (...args: Args) => C;
export function pipe<Args extends any[], A, B, C, D>(
  fn1: (...args: Args) => A,
  fn2: (val: A) => B,
  fn3: (val: B) => C,
  fn4: (val: C) => D,
): (...args: Args) => D;
export function pipe<Args extends any[], A, B, C, D, E>(
  fn1: (...args: Args) => A,
  fn2: (val: A) => B,
  fn3: (val: B) => C,
  fn4: (val: C) => D,
  fn5: (val: D) => E,
): (...args: Args) => E;
export function pipe<Args extends any[], A, B, C, D, E, F>(
  fn1: (...args: Args) => A,
  fn2: (val: A) => B,
  fn3: (val: B) => C,
  fn4: (val: C) => D,
  fn5: (val: D) => E,
  fn6: (val: E) => F,
): (...args: Args) => F;
export function pipe<T>(...fns: Array<(val: T) => T>): (val: T) => T;
export function pipe(...fns: any[]) {
  return (input: any) => fns.reduce((val, fn) => fn(val), input);
}
