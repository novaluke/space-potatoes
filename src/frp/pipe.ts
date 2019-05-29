import { Pipe } from "ts-functionaltypes";

export const pipe: Pipe = (...fns) => input =>
  fns.reduce((val, fn) => fn(val), input);
