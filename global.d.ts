// From https://github.com/grgbrn/p5ts-boilerplate
// Creates global types and types under "p5.*"

import module = require("p5");

export = module;
export as namespace p5;
declare global {
  interface Window {
    p5: typeof module;
  }
}
