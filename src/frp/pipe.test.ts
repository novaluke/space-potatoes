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

  it("works when the first function takes multiple arguments", () => {
    const fn1 = (firstName: string, lastName: string): number =>
      (firstName + lastName).length;
    const fn2 = (val: number): boolean => val > 9;
    const willBeTrue = ["William", "Wilberforce"];
    const willBeFalse = ["John", "Smith"];

    // prettier-ignore
    expect(pipe(fn1, fn2)(willBeTrue[0], willBeTrue[1])).toBe(true);
    // prettier-ignore
    expect(pipe(fn1, fn2)(willBeFalse[0], willBeFalse[1])).toBe(false);
  });
});
