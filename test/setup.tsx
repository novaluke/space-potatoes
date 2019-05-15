import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";

import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import { render as rtlRender } from "react-testing-library";

function render(
  ui,
  {
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] }),
    // tslint:disable-next-line:trailing-comma
    ...renderOptions
  } = {},
) {
  return {
    ...rtlRender(<Router history={history}>{ui}</Router>, renderOptions),
    history,
  };
}
