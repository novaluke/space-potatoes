import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";

import { createMemoryHistory } from "history";
import React from "react";
import { Router } from "react-router-dom";
import { render as rtlRender } from "react-testing-library";

beforeEach(() => {
  jest.clearAllMocks();
});

export const flushPromises = () =>
  new Promise(resolve => setImmediate(resolve));

export const render = (
  ui: JSX.Element,
  {
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] }),
    // tslint:disable-next-line:trailing-comma
    ...renderOptions
  } = {},
) => ({
  ...rtlRender(<Router history={history}>{ui}</Router>, renderOptions),
  history,
});
