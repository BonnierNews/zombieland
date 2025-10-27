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

	const dom = await browser.load(response);
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
- `cookieJar` `<CookieJar>` A [jar of cookies](https://github.com/jsdom/jsdom/blob/main/README.md#cookie-jars) to be used by fetch calls

#### `browser.navigateTo(url[, headers, jsdomOptions])`

Fetches and loads a DOM

- `url` `<string>` | `<URL>` URL to a DOM – relative to the browser origin
- `headers` `<Headers>` | `<Object>` Request headers. *Default* `{}`.
- `jsdomOptions` `<Object>` [Options to pass on to `JSDOM`](https://github.com/jsdom/jsdom/blob/main/README.md#simple-options). *Default* `{}`
- Returns: `<Promise>` Fulfills with a `JSDOM` on success

```js
const dom = await browser.navigateTo(
	'/',
	{ 'Cookie'; 'some-cookie=value;' },
	{ runScripts: 'dangerously' }
);
```

#### `browser.fetch(url[, options])`

Fetches a document response. Useful for inspecting response details before loading DOM.

- `url` `<string>` | `<URL>` Pathname / URL to a document – relative to the browser origin
- `options` `<Object>` A `RequestInit` dictionary. *Default* `{}`.
- Returns: `<Promise>` Fulfills with a `Response` on success

```js
const pendingResponse = browser.fetch(
	'/',
	{ 'Cookie'; 'some-cookie=value;' }
);
```

#### `browser.load(response[, jsdomOptions])`

Loads a document from a response

- `response` `<Response>` | `<Promise>` A response to load into JSDOM
- `jsdomOptions` `<Object>` [Options to pass on to `JSDOM`](https://github.com/jsdom/jsdom/blob/main/README.md#simple-options). *Default*
	- `runScripts`: `'outside-only'`
	- `pretendToBeVisual`: `true`
	- `url`: `url` from `response`
	- `contentType`: `Content-Type` response header from `response`
	- `cookieJar`: `cookieJar` from `browser`
- Returns: `<Promise>` Fulfills with a `JSDOM` on success

```js
const dom = await browser.load(
	pendingResponse,
	{ runScripts: 'dangerously' }
);
```

#### `browser.captureNavigation(dom[, follow])`

Captures navigation from a link click or a form sumbmit

- `dom` `<JSOM>` A dom to observe
- `follow` `<Boolean>` To follow request or not. *Default* `false`
- Returns: `<Promise>` Resolves with either a `<Request>` or `<Response>` if truthy `follow` option. Rejects with an `Event` which blocked the navigation.

```js
const pendingNavigation = await browser.captureNavigation(dom, true);
dom.window.querySelector('a[link], form button[type=submit]').click();
const response = await pendingNavigation;
```

### `ReverseProxy`

A module for emulating a public web origin for a local application. Basically a wrapper around `nock`.

```js
import { ReverseProxy } from '@zombieland/tallahassee';
```

#### `new ReverseProxy(proxyOrigin, upstreamOrigin[, headers])`

Creates a proxy from a public origin to a local origin

- `proxyOrigin` `<string>` Public URL origin
- `upstreamOrigin` `<string>` Server URL origin
- `headers` `<Object>` Headers to pass along to server
- Returns: `<ReverseProxy>`

```js
import { Browser, ReverseProxy } from '@zombieland/tallahassee';

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
