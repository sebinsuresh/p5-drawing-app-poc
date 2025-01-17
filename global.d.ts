// From https://github.com/grgbrn/p5ts-boilerplate
// Creates global types and types under "p5.*"

import module = require("p5");
import * as p5Global from "p5/global";

export = module;
export as namespace p5;
declare global {
  interface Window {
    p5: typeof module;
  }
}
