# Background

[Tallahassee](https://github.com/BonnierNews/tallahassee) is great! It's powerful enough to test your applications entire client side. It's "hackable" enough to emulate most scenarios / quirks occurring in an actual browser, making it suitable for both feature and unit style testing. It's lightweight enough to not be an excuse for skimping on testing.

However it isn't perfect. Here are some of the larger issues with the current lib.

### Incomplete implementation of DOM interfaces

DOM interfaces have been implemented as needs have occurred with **varying** fidelity to the W3 spec.

The browser JS environment is massive, the Tallahassee counterpart is not. It can be really educational and fun to reconstruct parts of the browser. It can also be very annoying when you stumble upon parts of the DOM that aren't implemented.

The ratio of impact vs. effort to supplement the Tallahassee environment too often favours a workaround in your own code.

Sprinkled in with the _sparse_ browser environment there are a lot of custom interfaces - eg. `element._emitter`, `element._setBoundingClientRect()`. In the first case the `_` denotes that the property for internal use. In the second case it denotes that the method is not a part of the W3 spec but meant to be used externally.

It's unclear where the standard DOM ends and where Tallahassee begins.

### Documentation

Is there one?

A lot of what would qualify for documentation can only be found in other applications' test suites.

If one were to properly document the lib what would be the scope? The entire browser environment implementation? The differences between the Tallahassee environment and the W3 spec? If all differences are part of the public API then a patch change might be considered minor or even major.

It gets kinda dicey since the bounds of the tool is unclear.

### Single page API

The API is designed to load one single page and it blends the roles of browser and page.

This makes it awkward to test a series of page loads.

## Proposed solution

There is a tool that does **most** of what the Tallahassee code base tries to do - replicate a browser environment. It's called [jsdom](https://github.com/jsdom/jsdom). The rest can be built as a toolkit of independent extensions to jsdom - Zombieland.

## Drawbacks

### JSDOM
JSDOM is kind of a black box compared to current Tallahassee browser environment. Read only properties are read only. Don't know if this is a big problem.

It is not as fully featured as it appears. Polyfills are required for some basic functions, such as `fetch`.

### "Independent _single_ purpose extensions"
The intention of making each tool independent sounds like a good idea but is it? Could make the API's overly complex! Does anyone want / need a setup like JSDOM, Tallahasse and Little Rock but not Whichita?

### Custom script executor
Useful but feels wrong. [The VM source text module is experimental](https://nodejs.org/api/vm.html#vm_class_vm_sourcetextmodule).
