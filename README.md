# Zombieland

Tallahassee is great! It's powerful enough to test your applications entire client side. It's "hackable" enough to emulate most scenarios / quirks occurring in an actual browser, making it suitable for both feature and unit style testing. It's lightweight enough to not be an excuse for skimping on testing.

[However it isn't perfect...](https://github.com/BonnierNews/zombieland/blob/main/BACKGROUND.md)

Proposed solution is to delegete all the DOM stuff to [jsdom](https://github.com/jsdom/jsdom). Other key features are built as **a toolkit of independent _single_ purpose extensions**.

## Tallahassee

A browser module for loading pages, containing subsequent requests, persisting cookies etc.

More or less a convenient wrapper around *[SuperTest](https://github.com/visionmedia/supertest), [Tough Cookie](https://github.com/salesforce/tough-cookie) and jsdom. The browser scope will also make it easy to test a session, or multiple parallell sessions, as opposed to a single page load.

SuperTest also enables passing along HTTP headers with a request which doesn't seem to be supported by the [jsdom `fromURL`](https://github.com/jsdom/jsdom#fromurl).

*See [TODO](#TODO) for notes on the use of SuperTest

> I really want the name Tallahassee to remain, although Columbus sounds more _browsery_.

## Little Rock

A layout module implementing everything visual.

JSDOM does not provide a way to emulate layout out of the box. When major part of an application's client side JS consists of lazy loading / sticky behaviour etc. this is required.

## Wichita

A resource module for running client side JS and resolving assets.

JSDOM does run scripts quite well. It does however not provide a controlled way to execute scripts at a _convenient time_. A pattern when testing something is asserting an element original state, running the scripts then asserting the element's new state. JSDOM will, like a browser, run any client script as soon as it has loaded making it _tricky_ to run assertions prior to script execution.

Custom script executor enables running code at any given time. Also it enables running source code over a built resource which is good for rapid retesting.

Resolver enables "binding" script tags to files making the test suite less verbose and less prone to mistakes.

This could be achieved by extending the `jsdom.ResourceLoader` interface with some execution code - a sort of rewrite of existing package [Wichita](https://github.com/BonnierNews/wichita).

## ?

Any other key features?

> Would be nice with at least 4 core modules so that all main characters are represented ;D


## Drawbacks

### JSDOM
JSDOM is kind of a black box compared to current Tallahassee browser environment. Read only properties are read only. Don't know if this is a big problem.

It is not as fully featured as it appears. Polyfills are required for some basic functions, such as `fetch`.

### "Independent _single_ purpose extensions"
The intention of making each tool independent sounds like a good idea but is it? Could make the API's overly complex! Does anyone want / need a setup like JSDOM, Tallahasse and Little Rock but not Whichita?

### Custom script executor
Useful but feels wrong. [The VM source text module is experimental](https://nodejs.org/api/vm.html#vm_class_vm_sourcetextmodule).


## TODO

- [ ] Sleek, consistent APIs for all modules
- [ ] Separate submodules to separate packages
- [ ] Verified and tested CJS support
- [x] Forward JSDOM exports

### Tallahassee

- [ ] In-page navigation (clicking links etc.)
- [ ] Reloading page
- [ ] Unload browser and all its active jsdom instances
- [ ] Expose network requests
- [x] Use node `fetch` / `Response`
	- [ ] Stable version of Nock
- [x] Containing requests to the app is currently done by setting up a `nock` scope around app origin which intercepts all reqs and proxies them through `supertest`. Not ideal for a bunch of reasons:
	- [x] There is no built in way to clear a specific scope - [creative workaround](https://github.com/nock/nock/issues/1495#issuecomment-499594455)
- [x] Scrap use of SuperTest. It's incorrectly used as an HTTP lib because of its ability to _make requests to a server_. Not having a listening server makes handling of client side requests messy. Calls to `XMLHttpRequest` needs to be intercepted and cookies will need to be handled manually. Also having the consumer starting / stopping their server once per test process would be more performant than doing it adhoc for each request.


### Little Rock

- [ ] Means to emulate fixed / sticky / hidden layout.
- [ ] Further implement web APIs such as setters for `Element.scrollLeft` / `.scrollTop`
- [ ] Cache for layout calculation. Clear on paints and DOM updates. Mutation observer would work it it were synchronous.
- [x] Paint method behaves different when used on an element and a selector. Maybe it should. Styles applied to element will overwrite previous styles. Styles applied to selector will be appended to stylesheet.
- [x] Scrolling behavior is **very** bare bones.
- [x] Painting with both "stylesheets" and "elements" might not cause expected behavior. When scrolling an initial paint will read from all style sources: first stylesheet then element. Then compiled diff will be applied to element giving it the "importance" of inline styles.
- [x] Convert to classes like JSDOM and the rest of the modules.
- [x] Further implement web APIs such as `Element.scrollWidth` / `.scrollHeight`
- [x] Limitations on scroll coordinates.
- [x] Automatic dimensions / coordinates. Maybe just paint method could take a list of elements with like `{ y: 'auto' }` and it could stack them along the supplied axis, optionally updating supplied parent. Would be nice if it could work with dynamically injected elements / stylesheets as well.
- [x] Cleanup parent / child management - implicit relations to `Window` etc.

### Whichita

- [ ] Not using the ES module feature mustn't require the `--experimental-vm-modules` flag.
- [ ] VM evaluation based on script `type` attribute.
- [ ] Respecting `nomodule` like modern / legacy browser.
- [ ] Support for importing CJS modules in Script
- [x] Expose Script exports
- [x] Cache for FS operations.
- [x] Have not been able to make a working example using `fetch` along with [the community recommended polyfill](https://github.com/jsdom/jsdom/issues/1724#issuecomment-720727999). Did make it with another polyfill though :fingers_crossed:
