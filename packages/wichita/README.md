# Wichita

A resource module for running client side JS and resolving assets.

JSDOM does run scripts quite well. It does however not provide a controlled way to execute scripts at a _convenient time_. A pattern when testing something is asserting an element original state, running the scripts then asserting the element's new state. JSDOM will, like a browser, run any client script as soon as it has loaded making it _tricky_ to run assertions prior to script execution.

Custom script executor enables running code at any given time. Also it enables running source code over a built resource which is good for rapid retesting.

Resolver enables "binding" script tags to files making the test suite less verbose and less prone to mistakes.

## Todo

- [ ] Not using the ES module feature mustn't require the `--experimental-vm-modules` flag.
- [ ] VM evaluation based on script `type` attribute.
- [ ] Respecting `nomodule` like modern / legacy browser.
- [ ] Support for importing CJS modules in Script
- [x] Expose Script exports
- [x] Cache for FS operations.
- [x] Have not been able to make a working example using `fetch` along with [the community recommended polyfill](https://github.com/jsdom/jsdom/issues/1724#issuecomment-720727999). Did make it with another polyfill though :fingers_crossed:
