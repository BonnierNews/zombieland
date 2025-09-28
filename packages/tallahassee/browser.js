import jsdom from 'jsdom';

export default class Browser {
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
		this.#persistCookies(url, headers);
		headers.delete('cookie');
		headers.set('cookie', this.cookieJar.getCookieStringSync(url.href));

		const response = await fetch(url, { ...options, headers, redirect: 'manual' });

		this.#persistCookies(response.url || url, null, response.headers);

		if (![ 301, 302, 303, 307, 308 ].includes(response.status))
			return response;

		const redirectOptions = { ...options, headers: undefined };
		if (response.status <= 303) {
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
			pretendToBeVisual: true,
			...jsdomConfig,
			...(isResponse && {
				url: response.url || undefined,
				contentType: response.headers.get('content-type') || undefined,
			}),
			cookieJar: this.cookieJar,
			beforeParse: window => {
				this.beforeParse(window);
				jsdomConfig.resources?.beforeParse?.(window);
				jsdomConfig.painter?.beforeParse(window);
				jsdomConfig.beforeParse?.(window);
			}
		});
	}

	getPendingNavigation (dom) {
		const browser = this;

		return new Promise(resolve => {
			dom.window.addEventListener('click', catchLinkClick);
			dom.window.addEventListener('submit', catchFormSubmit);

			function catchLinkClick (event) {
				const link = event.target.closest('a');
				if (!link) return;

				return runDefault(event, link.href);
			}

			function catchFormSubmit (event) {
				const form = event.target.closest('form');
				if (!form) return;

				return runDefault(event, form.action, {
					method: form.method,
					body: new dom.window.FormData(form, event.submitter),
				});
			}

			function runDefault (event, url, options) {
				if (event.defaultPrevented) {
					dom.window.removeEventListener('click', catchLinkClick);
					dom.window.removeEventListener('submit', catchFormSubmit);
					return resolve(null);
				}

				event.preventDefault();
				dom.window.dispatchEvent(new dom.window.Event('pagehide'));
				dom.window.close();
				resolve(browser.fetch(url, options));
			}
		});
	}

	#persistCookies (url, reqHeaders, resHeaders) {
		let directives;
		if (reqHeaders)
			directives = reqHeaders.get('cookie')
				?.split(';')
				.map(d => d.trim())
				.filter(Boolean);
		else if (resHeaders)
			directives = resHeaders.getSetCookie();

		for (const directive of directives || []) {
			this.cookieJar.setCookieSync(directive, url.href || url);
		}
	}

	beforeParse (window) {
		Object.defineProperties(window.Event.prototype, {
			defaultPrevented: {
				writable: true,
			},
			preventDefault: {
				value: function () {
					this.defaultPrevented = true;
				}
			}
		});
		Object.defineProperties(window.HTMLAnchorElement.prototype, {
			click: {
				value: function () {
					this.dispatchEvent(new window.Event('click', { bubbles: true }));
				}
			}
		});
	}
};
