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
		url = new URL(url, this.origin);
		if (headers)
			this.#persistCookies(headers, url);

		const response = this.request(url, { headers });
		return this.load(response, jsdomConfig);
	}

	async load (pendingResponse, jsdomConfig = {}) {
		const response = await pendingResponse;
		return new jsdom.JSDOM(String(response), {
			runScripts: 'outside-only',
			...jsdomConfig,
			...(response.url && {
				url: response.url,
				contentType: response.headers['content-type'],
			}),
			cookieJar: this.cookieJar,
			beforeParse: window => {
				jsdomConfig.resources?.beforeParse?.(window);
				jsdomConfig.beforeParse?.(window);
			}
		});
	}

	async request (url, options = {}) {
		url = new URL(url, this.origin);

		const { method = 'get', headers = {}, credentials = true } = options;
		if (credentials)
			headers.cookie = this.cookieJar.getCookieStringSync(url.href);

		const response = await request(url, { ...options, method, headers });
		if (credentials)
			this.#persistCookies(response.headers, url);

		const { statusCode } = response;
		if (statusCode >= 300 && statusCode < 400) {
			return this.request(
				new URL(response.headers.location, url.origin),
				statusCode === 303 ?
					{ method: 'get', credentials } :
					{ method, body: options.body, credentials }
			);
		}

		return response;
	}

	#persistCookies (headers, url) {
		const cookieDirectives = headers['set-cookie'] ||
			headers.cookie?.split('; ');

		for (const cookieDirective of cookieDirectives || []) {
			this.cookieJar.setCookieSync(cookieDirective, url.href);
		}
	}
};
