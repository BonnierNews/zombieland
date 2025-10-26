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
				jsdomConfig.resources?.beforeParse?.(window);
				jsdomConfig.painter?.beforeParse(window);
				jsdomConfig.beforeParse?.(window);
			}
		});
	}

	captureNavigation (dom, follow) {
		const browser = this;

		return new Promise((resolve, reject) => {
			dom.window.addEventListener('click', captureLinkClick);
			dom.window.addEventListener('submit', captureFormSubmit);
			for (const form of dom.window.document.forms)
				for (const element of form.elements)
					element.addEventListener('invalid', captureFormElementInvalid);

			function captureLinkClick (event) {
				const link = event.target.closest('a');
				if (!link) return;

				runDefault(event, link.href);
			}

			function captureFormSubmit (event) {
				const form = event.target;
				const submitter = event.submitter;
				const method = submitter?.formMethod || form.method;
				const action = new URL(submitter?.formAction || form.action);
				const body = new dom.window.FormData(form, submitter);

				if (method === 'post') {
					const enctype = submitter?.formEnctype || form.enctype;

					return runDefault(event, action, {
						method,
						headers: { 'content-type': enctype },
						body,
					});
				}

				for (const [ key, value ] of body) {
					action.searchParams.set(key, value);
				}

				runDefault(event, action);
			}

			function captureFormElementInvalid () {
				cleanUp();
				return reject(new Error('Form element was invalid'))
			}

			function runDefault (event, url, options) {
				cleanUp();
				if (event.defaultPrevented) {
					return reject(new Error('Navigation was prevented'));
				}

				event.preventDefault();
				if (!follow) {
					return resolve(new Request(url, options));
				}

				dom.window.dispatchEvent(new dom.window.Event('pagehide'));
				dom.window.close();
				resolve(browser.fetch(url, options));
			}

			function cleanUp () {
				dom.window.removeEventListener('click', captureLinkClick);
				dom.window.removeEventListener('submit', captureFormSubmit);
				for (const form of dom.window.document.forms)
					for (const element of form.elements)
						element.removeEventListener('invalid', captureFormElementInvalid);
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
};
