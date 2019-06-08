# Space Potatoes: Home-cooked FRP

This is a simple remake of the 1979 Atari game, "Asteroids". Emphasis is on
simple - the goal here was not to create an amazing game, but to experiment with
creating a Functional Reactive Programming system, so as to better understand
how they work, what drives them under the hood, and explore functional
programming with TypeScript.

## Usage (firing up the game)

Either visit <https://space-potatoes.webuildlegends.com> or clone the repository
and run `yarn start`.

## Running tests

Tests can be run with `yarn test` (or run in debug mode with `yarn test:debug`).
Test coverage is not complete. Due to difficulty in testing canvas-related
functionality, rendering code is currently not tested. Furthermore, due to time
constraints, the main game code is not tested either. However, test coverage for
the FRP library side of the project (`src/frp`) is mostly complete.

---

Inspired by ["Code Asteroids in JavaScript (1979 Atari game) - tutorial
[YouTube]](https://www.youtube.com/watch?v=H9CSWMxJx84) and [Reactivity from
Scratch
[YouTube]](https://www.youtube.com/playlist?list=PLrhzvIcii6GN_vruBNu04EVHo0PKixXwE)
