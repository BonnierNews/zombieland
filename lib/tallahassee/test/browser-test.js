

const assert = require('assert/strict');
const Browser = require('../browser.js');
const nock = require('nock');

describe('Browser', () => {
	before(() => nock.disableNetConnect());
	beforeEach(() => nock.cleanAll());

	const url = new URL('http://example.com/');
	let browser;
	beforeEach(() => browser = new Browser(url.origin));
	after(() => nock.enableNetConnect());

	describe('.navigateTo()', () => {
		it('navigates to document with URL', async () => {
			nock(url.origin)
				.get('/')
				.reply(200, '<title>Document from URL');

			const dom = await browser.navigateTo('/');
			assert(dom.window.document.title, 'Document from URL');
		});
	});

	describe('.fetch()', () => {
		it('fetches resource', async () => {
			nock(url.origin)
				.post(url.pathname)
				.reply(function (path, body) {
					assert.equal(this.req.headers['req-header'], 'value');
					assert.equal(body, 'request body');
					return [ 200, 'response body', { 'res-header': 'value' } ];
				});

			const response = await browser.fetch(url, {
				method: 'post',
				headers: { 'req-header': 'value' },
				body: 'request body',
			});

			assert.equal(response.status, 200);
			assert.equal(response.headers.get('res-header'), 'value');

			const responseBody = await response.text();
			assert.equal(responseBody, 'response body');
		});

		[
			[ 301, 'moved-permanently' ],
			[ 302, 'found' ],
			[ 303, 'see-other' ],
		].forEach(([ status, location ]) => {
			it(`follows ${status} redirect`, async () => {
				nock(url.origin)
					.post(url.pathname)
					.reply(status, undefined, { location: `/${location}` })
					.get(`/${location}`)
					.reply(function (path, body) {
						const { headers } = this.req;
						assert.equal(headers['initial-request-header'], undefined);
						assert.equal(body, '');
						return [ 200 ];
					});

				const response = await browser.fetch(url, {
					method: 'post',
					headers: { 'initial-request-header': 'value' },
					body: 'initial request body',
				});

				assert.equal(response.status, 200);
			});
		});

		[
			[ 307, 'temporary-redirect' ],
			[ 308, 'permanent-redirect' ],
		].forEach(([ status, location ]) => {
			it(`follows ${status} redirect with method and body unchanged`, async () => {
				nock(url.origin)
					.post(url.pathname)
					.reply(status, undefined, { location: `/${location}` })
					.post(`/${location}`)
					.reply(function (path, body) {
						const { headers } = this.req;
						assert.equal(headers['initial-request-header'], undefined);
						assert.equal(body, 'initial request body');
						return [ 200 ];
					});

				const response = await browser.fetch(url, {
					method: 'post',
					headers: { 'initial-request-header': 'value' },
					body: 'initial request body',
				});

				assert.equal(response.status, 200);
			});
		});

		it('persists request cookies to cookie jar', async () => {
			nock(url.origin)
				.get('/requires-authentication')
				.times(2)
				.reply(function () {
					assert.equal(this.req.headers.cookie, 'logged-in=1');
					return [ 200, 'OK' ];
				});

			await browser.fetch(
				'/requires-authentication',
				{ headers: { cookie: 'logged-in=1' } }
			);

			const response = await browser.fetch('/requires-authentication');
			assert.equal(response.status, 200);
		});

		it('persists response cookies to cookie jar', async () => {
			nock(url.origin)
				.post('/login')
				.reply(200, 'OK', { 'set-cookie': 'logged-in=1' })
				.get('/requires-authentication')
				.reply(function () {
					assert.equal(this.req.headers.cookie, 'logged-in=1');
					return [ 200, 'OK' ];
				});

			await browser.fetch('/login', { method: 'post' });
			const response = await browser.fetch('/requires-authentication');
			assert.equal(response.status, 200);
		});

		it('persists cookies through redirect chain', async () => {
			nock(url.origin)
				.post('/login')
				.reply(function () {
					return this.req.headers.cookie === 'user=zombie' ?
						[ 401, 'Unauthorized' ] :
						[ 302, 'Found', {
							'set-cookie': 'logged-in=1',
							'location': '/requires-authentication'
						} ];
				})
				.get('/requires-authentication')
				.reply(function () {
					assert.equal(this.req.headers.cookie, 'user=person; logged-in=1');
					return [ 200, 'OK' ];
				});

			const response = await browser.fetch('/login', {
				method: 'post',
				headers: { cookie: 'user=person' }
			});

			assert.equal(response.status, 200);
		});
	});

	describe('.load()', () => {
		it('loads document from string', async () => {
			const dom = await browser.load('<title>Document from string');
			assert(dom.window.document.title, 'Document from string');
		});

		it('loads document from response', async () => {
			nock(url.origin)
				.post('/secure')
				.reply((path, body) => {
					return body === 'password' ?
						[ 200, '<title>Welcome' ] :
						[ 401, '<title>Get out' ];
				});

			const response = await browser.fetch('/secure', {
				method: 'post',
				body: 'password'
			});

			assert.equal(response.status, 200);

			const dom = await browser.load(response);
			assert(dom.window.document.title, 'Welcome');
		});

		it('loads document with details from response', async () => {
			nock(url.origin)
				.get('/xml-document')
				.reply(
					200,
					'<xml><land><zombie /></land></xml>',
					{ 'content-type': 'application/xml' }
				);

			const pendingResponse = browser.fetch('/xml-document');
			const dom = await browser.load(pendingResponse);
			assert.equal(dom.window.location.href, url.origin + '/xml-document');
			assert.equal(dom.window.document.contentType, 'application/xml');
		});
	});
});
