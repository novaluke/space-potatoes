import { restoreRAF, step, useMockRAF } from "../../test/mockRAF";
import { fromAnimationFrame, fromDOMEvent } from "./Event";

describe("Event", () => {
  describe("fromAnimationFrame", () => {
    beforeEach(() => useMockRAF());
    afterEach(() => restoreRAF());

    it("emits the delta since the last animation frame", () => {
      const event = fromAnimationFrame();
      const sub = jest.fn();
      const delta = 1337;

      event.subscribe(sub);
      step();
      step(1, delta);

      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenCalledWith(delta);
    });
  });

  describe("fromDOMEvent", () => {
    it("emits whenever the DOM event for the element fires", () => {
      const ele = document.createElement("button");
      const event = fromDOMEvent(ele, "click");
      const sub = jest.fn();
      const domEvent = new Event("click");
      event.subscribe(sub);

      ele.dispatchEvent(domEvent);
      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenLastCalledWith(domEvent);

      // Check that it doesn't emit for other event types.
      ele.dispatchEvent(new Event("keydown"));
      expect(sub).toHaveBeenCalledTimes(1);
    });
  });
});
