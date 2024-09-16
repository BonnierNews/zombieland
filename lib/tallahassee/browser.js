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
		const response = this.fetch(url, headers && { headers });
		return this.load(response, jsdomConfig);
	}

	async fetch (url, options = {}) {
		url = new URL(url, this.origin);

		const headers = new Headers(options.headers);
		this.#persistCookies(headers, url);
		headers.delete('cookie');
		headers.set('cookie', this.cookieJar.getCookieStringSync(url.href));

		const response = await fetch(url, {
			...options,
			redirect: 'manual',
			headers
		});

		this.#persistCookies(response.headers, response.url || url);

		const { status } = response;
		if (![ 301, 302, 303, 307, 308 ].includes(status)) return response;

		const redirectOptions = { ...options, headers: undefined };
		if (status <= 303) {
			delete redirectOptions.method;
			delete redirectOptions.body;
		}

		return this.fetch(response.headers.get('location'), redirectOptions);
	}

	async load (pendingResponse, jsdomConfig = {}) {
		const response = await pendingResponse;
		const isResponse = response instanceof Response;
		const document = isResponse ? await response.text() : response;

		return new jsdom.JSDOM(document, {
			runScripts: 'outside-only',
			...jsdomConfig,
			...(isResponse && {
				url: response.url || 'about:blank',
				contentType: response.headers.get('content-type') || 'text/html; utf-8',
			}),
			cookieJar: this.cookieJar,
			beforeParse: window => {
				jsdomConfig.resources?.beforeParse?.(window);
				jsdomConfig.painter?.beforeParse(window);
				jsdomConfig.beforeParse?.(window);
			}
		});
	}

	#persistCookies (headers, url) {
		const cookieDirectives = [
			headers.get('cookie')?.split('; ') ||
			headers.getSetCookie()
		]
			.flat()
			.filter(Boolean);

		for (const cookieDirective of cookieDirectives) {
			this.cookieJar.setCookieSync(cookieDirective, url.href || url);
		}
	}
};
