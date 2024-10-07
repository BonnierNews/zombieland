# Tallahassee

A browser module for loading pages, containing subsequent requests, persisting cookies etc.

More or less a convenient wrapper around *[SuperTest](https://github.com/visionmedia/supertest), [Tough Cookie](https://github.com/salesforce/tough-cookie) and jsdom. The browser scope will also make it easy to test a session, or multiple parallell sessions, as opposed to a single page load.

SuperTest also enables passing along HTTP headers with a request which doesn't seem to be supported by the [jsdom `fromURL`](https://github.com/jsdom/jsdom#fromurl).

*See [TODO](#TODO) for notes on the use of SuperTest

> I really want the name Tallahassee to remain, although Columbus sounds more _browsery_.

## Todo

- [x] Use node `fetch` / `Response`
	- [ ] Stable version of Nock
- [ ] In-page navigation (clicking links etc.)
- [ ] Reloading page
- [ ] Unload browser and all its active jsdom instances
- [ ] Expose network requests
- [x] Containing requests to the app is currently done by setting up a `nock` scope around app origin which intercepts all reqs and proxies them through `supertest`. Not ideal for a bunch of reasons:
	- [x] There is no built in way to clear a specific scope - [creative workaround](https://github.com/nock/nock/issues/1495#issuecomment-499594455)
- [x] Scrap use of SuperTest. It's incorrectly used as an HTTP lib because of its ability to _make requests to a server_. Not having a listening server makes handling of client side requests messy. Calls to `XMLHttpRequest` needs to be intercepted and cookies will need to be handled manually. Also having the consumer starting / stopping their server once per test process would be more performant than doing it adhoc for each request.
