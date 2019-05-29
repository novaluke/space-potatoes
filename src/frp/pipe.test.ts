import { pipe } from "./pipe";

describe("pipe", () => {
  it("passes the value through the functions from left to right", () => {
    const fn1 = (val: string): number => val.length;
    const fn2 = (val: number): boolean => val > 6;
    const willBeTrue = "7 chars";
    const willBeFalse = "just 6";

    // prettier-ignore
    expect(pipe(fn1, fn2)(willBeTrue)).toBe(true);
    // prettier-ignore
    expect(pipe(fn1, fn2)(willBeFalse)).toBe(false);
  });
});
