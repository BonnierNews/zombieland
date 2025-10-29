# Tallahassee

A browser module around JSDOM for testing a web application as opposed to a document. Navigation with headers, cookies, clicks and form submits.

> I really want the name Tallahassee to remain, although Columbus sounds more _browsery_.

## Basic usage

```js
import assert from 'node:assert/strict';
import { Browser } from '@zombieland/tallahassee';

let browser;
before('a browser with a default origin', () => {
	browser = new Browser('http://localhost:7411');
});

test('simple navigation', () => {
	const dom = await browser.navigateTo('/');
	assert.equal(dom.window.document.title, 'Zombieland');
});

test('detailed navigation', () => {
	const response = await browser.fetch('/', { 'Cookie': 'signed-in=1' });
	assert.equal(response.status, 200);

	const dom = await browser.load(response, { runScripts: 'dangerously' });
	assert.equal(dom.window.document.title, 'Zombieland');
});
```

## API

### `Browser`

A module for testing navigation within an origin

```js
import { Browser } from '@zombieland/tallahassee';
```

#### `new Browser(origin[, cookieJar])`

Creates a new browser instance

- `origin` `<string>` Base URL used by `browser.fetch`
- `cookieJar` `<CookieJar>` A [jar of cookies](https://github.com/jsdom/jsdom/blob/main/README.md#cookie-jars) to be used by browser `fetch` method. **Default** `new CookieJar()`

#### `browser.navigateTo(url[, headers, jsdomOptions])`

Fetches a document and loads a DOM

- `url` `<string>` | `<URL>` URL to a DOM – relative to the browser origin
- `headers` `<Headers>` | `<Object>` Request headers. **Default** `{}`.
	- Cookies from `Cookie` header will be automatically added to browser cookie jar
- `jsdomOptions` `<Object>` [Options to forward to `JSDOM`](https://github.com/jsdom/jsdom/blob/main/README.md#simple-options).
- Returns: `<Promise>` Fulfills with a `JSDOM` on success

```js
const dom = await browser.navigateTo(
	'/',
	{ 'Cookie'; 'some-cookie=value' },
	{ runScripts: 'dangerously' }
);
```

#### `browser.fetch(url[, options])`

Fetches a document. Useful for inspecting response details before loading DOM.

- `url` `<URL>` | `<string>` URL / path to a document – relative to the browser origin
- `options` `<Object>` A `RequestInit` dictionary. **Default** `{}`
- Returns: `<Promise>` Fulfills with a `Response` on success

```js
const pendingResponse = browser.fetch('/', {
	'Cookie'; 'some-cookie=value;'
});
```

#### `browser.load(response[, jsdomOptions])`

Loads a DOM from a document or a document response

- `response` `<Response>` | <string> | `<Promise>` A response to load into JSDOM
- `jsdomOptions` `<Object>` [Options to pass on to `JSDOM`](https://github.com/jsdom/jsdom/blob/main/README.md#simple-options).
	- **Default**:
		- `runScripts`: `'outside-only'`
		- `pretendToBeVisual`: `true`
	- **Fixed values**:
		- `url`: `url` from `response` if instance of `Response`
		- `contentType`: `Content-Type` response header from `response` if instance of `Response`
		- `cookieJar`: `cookieJar` from `browser` instance
		- `beforeParse`: A function that will run:
			- `jsdomOptions.painter?.beforeParse`: From a Little Rock `Painter` instance
			- `jsdomOptions.resources?.beforeParse`: From a Wichita `Resources` instance
			- `jsdomOptions.beforeParse`
- Returns: `<Promise>` Fulfills with a `JSDOM` on success

```js
const dom = await browser.load(pendingResponse, {
	runScripts: 'dangerously'
});
```

If using Little Rock and/or Wichita their `beforeParse` methods will be run automatically if passed into `jsdomOptions`:

```js
import { Browser } from "@zombieland/tallahassee";
import { Painter } from "@zombieland/little-rock";
import { ResourceLoader } from "@zombieland/wichita";

const browser = new Browser(…);
const pendingResponse = browser.fetch('/');
const dom = await browser.load(pendingResponse, {
	painter: new Painter(…),
	resources: new ResourceLoader(…),
});
```

#### `browser.captureNavigation(dom[, follow])`

Captures navigation from link clicks and form submits.

- `dom` `<JSDOM>` A DOM to observe
- `follow` `<Boolean>` To follow request or not. **Default** `false`
- Returns: `<Promise>` Resolves with a `<Request>` or `<Response>` from `fetch` if `follow: true`. Rejects with an `Event` which blocked the navigation.

```js
const linkOrFormSubmit = dom.window.querySelector('a, button[type=submit]');

const pendingNavigation = browser.captureNavigation(dom, false);
linkOrFormSubmit.click();
const request = await pendingNavigation;
assert(request instanceof Request);
```

Or with `follow: true` to perform a call to `browser.fetch()`

```js
const pendingNavigation = browser.captureNavigation(dom, true);
linkOrFormSubmit.click();
const response = await pendingNavigation;
assert(request instanceof Response);
```

Navigation will fail if stopped by:
- Prevented default action of link `click` / form `submit` event using `preventDefault()`
- Form element `invalid` event

```js
await assert.reject(pendingNavigation, (event) => {
	assert.equal(event.type, 'invalid');
	assert.equal(event.target, form.elements[1]);
	return true;
})
```

Navigation is intercepted at the `window` level using event listeners. Promise will not settle if event propagation is stopped or if form submit is triggered without event, e.g. with the `submit` method.

### `ReverseProxy`

A module for emulating a public web origin for a local application. Basically a wrapper around `nock`.

```js
import { ReverseProxy } from '@zombieland/tallahassee';
```

#### `new ReverseProxy(proxyOrigin, upstreamOrigin[, headers])`

Creates HTTP interceptor for a public proxy origin and proxies request to local upstream origin.

- `proxyOrigin` `<string>` Public URL origin
- `upstreamOrigin` `<string>` Server URL origin
- `headers` `<Object>` Headers to pass along to server
- Returns: `<ReverseProxy>`

```js
import http from 'node:http';
import { Browser, ReverseProxy } from '@zombieland/tallahassee';

http.createServer(…).listen(7411);
const reverseProxy = new ReverseProxy('https://tallahassee.zl', 'http://localhost:7411')
const browser = new Browser('https://tallahassee.zl');
const dom = await browser.navigateTo('/safe-house');
assert.equal(dom.window.location, 'https://tallahassee.zl/safe-house');
```

#### `reverseProxy.clear()`

Clears nocked responses for `proxyOrigin`

- Returns: `undefined`

```js
reverseProxy.clear();
```

## Todo

- [x] Use node `fetch` / `Response`
	- [x] Stable version of Nock
- [x] In-page navigation (clicking links etc.)
- [ ] Reloading page
- [ ] Unload browser and all its active jsdom instances
- [ ] Expose network requests
- [x] Containing requests to the app is currently done by setting up a `nock` scope around app origin which intercepts all reqs and proxies them through `supertest`. Not ideal for a bunch of reasons:
	- [x] There is no built in way to clear a specific scope - [creative workaround](https://github.com/nock/nock/issues/1495#issuecomment-499594455)
- [x] Scrap use of SuperTest. It's incorrectly used as an HTTP lib because of its ability to _make requests to a server_. Not having a listening server makes handling of client side requests messy. Calls to `XMLHttpRequest` needs to be intercepted and cookies will need to be handled manually. Also having the consumer starting / stopping their server once per test process would be more performant than doing it adhoc for each request.
