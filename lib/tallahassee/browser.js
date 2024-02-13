'use strict';

const jsdom = require('jsdom');
const ReverseProxy = require('./reverse-proxy.js');

module.exports = class Browser {
	static ReverseProxy = ReverseProxy;

	constructor (origin, cookieJar) {
		this.origin = origin;
		this.cookieJar = cookieJar || new jsdom.CookieJar();
	}

	async navigateTo (url, headers, jsdomConfig = {}) {
		const response = this.fetch(url, { headers });

		return this.load(response, jsdomConfig);
	}

	async load (pendingResponse, jsdomConfig = {}) {
		const response = await pendingResponse;
		const html = response instanceof Response ?
			await response.text() :
			response;

		return new jsdom.JSDOM(html, {
			runScripts: 'outside-only',
			...jsdomConfig,
			...(response.url && {
				url: response.url,
				contentType: response.headers['content-type'],
			}),
			cookieJar: this.cookieJar,
			beforeParse: window => {
				jsdomConfig.resources?.beforeParse?.(window);
				jsdomConfig.painter?.beforeParse(window);
				jsdomConfig.beforeParse?.(window);
			}
		});
	}

	async fetch (url, options = {}) {
		url = new URL(url, this.origin);

		const headers = new Headers(options.headers);
		this.#persistCookies(headers, url);
		headers.set('cookie', this.cookieJar.getCookieStringSync(url.href));

		const response = await fetch(url, { ...options, headers });
		this.#persistCookies(response.headers, response.url || url);

		return response;
	}

	#persistCookies (headers, url) {
		const cookieDirectives = [
			headers.getSetCookie() ||
			headers.get('cookie')?.split('; ')
		]
			.flat()
			.filter(Boolean);

		for (const cookieDirective of cookieDirectives) {
			this.cookieJar.setCookieSync(cookieDirective, url.href || url);
		}
	}
};
