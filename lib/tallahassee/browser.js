'use strict';

const jsdom = require('jsdom');
const request = require('./request.js');
const ReverseProxy = require('./reverse-proxy.js');

module.exports = class Browser {
	static ReverseProxy = ReverseProxy;

	constructor (origin, cookieJar) {
		this.origin = origin;
		this.cookieJar = cookieJar || new jsdom.CookieJar();
	}

	async navigateTo (url, headers, jsdomConfig = {}) {
		const response = this.request(url, { headers });

		return this.load(response, jsdomConfig);
	}

	async load (pendingResponse, jsdomConfig = {}) {
		const response = await pendingResponse;
		const html = await (response instanceof Response) ? response.text() : response;

		console.log(2, String(response.url));
		console.log(this.cookieJar.getCookieStringSync(response.url));
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

	async request (url, options = {}) {
		url = new URL(url, this.origin);

		const headers = new Headers(options.headers);
		this.#persistCookies(headers, url);
		headers.set('cookie', this.cookieJar.getCookieStringSync(url.href));

		const response = await fetch(url, { ...options, headers });
		console.log(response);
		this.#persistCookies(response.headers, response.url || url);

		return response;
	}

	#persistCookies (headers, url) {
		const cookieDirectives = [
			headers.get('set-cookie') ||
			headers.get('cookie')?.split('; ')
		]
			.flat()
			.filter(Boolean);

		for (const cookieDirective of cookieDirectives) {
			console.log('setCookieSync', cookieDirective, url.href || url);
			this.cookieJar.setCookieSync(cookieDirective, url.href || url);
		}
	}
};
