'use strict';

const assert = require('assert/strict');
const Browser = require('../browser.js');
const nock = require('nock');

describe('Browser', () => {
	before(() => nock.disableNetConnect());
	beforeEach(() => nock.cleanAll());
	after(() => nock.enableNetConnect());

	describe('.navigateTo()', () => {
		const origin = 'http://example.com';
		const browser = new Browser(origin);

		it('navigates to document with URL', async () => {
			nock(origin)
				.get('/')
				.reply(200, '<title>Document from URL');

			const dom = await browser.navigateTo('/');
			assert(dom.window.document.title, 'Document from URL');
		});
	});

	describe('.fetch()', () => {
		const url = new URL('http://example.com/');
		const browser = new Browser(url.origin);

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
				.get('/login')
				.reply(200, 'OK', { 'set-cookie': 'logged-in=1' })
				.get('/requires-authentication')
				.reply(function () {
					assert.equal(this.req.headers.cookie, 'logged-in=1');
					return [ 200, 'OK' ];
				});

			await browser.fetch('/login');
			const response = await browser.fetch('/requires-authentication');
			assert.equal(response.status, 200);
		});

		it('follows redirects', async () => {
			nock(url.origin)
				.get(url.pathname)
				.reply(307, undefined, { location: '/temporary-redirect' })
				.get('/temporary-redirect')
				.reply(308, undefined, { location: '/permanent-redirect' })
				.get('/permanent-redirect')
				.reply(301, undefined, { location: '/moved-permanently' })
				.get('/moved-permanently')
				.reply(302, undefined, { location: '/found' })
				.get('/found')
				.reply(303, undefined, { location: '/see-other' })
				.get('/see-other')
				.reply(200, 'response body', { 'res-header': 'value' });

			const response = await browser.fetch(url);
			assert.equal(response.status, 200);
			assert.equal(response.headers.get('res-header'), 'value');

			const responseBody = await response.text();
			assert.equal(responseBody, 'response body');
		});

		it('follows redirects with body and protocol', async () => {
			nock(url.origin)
				.post(url.pathname)
				.reply(307, undefined, { location: '/temporary-redirect' })
				.post('/temporary-redirect')
				.reply(308, undefined, { location: '/permanent-redirect' })
				.post('/permanent-redirect')
				.reply(301, undefined, { location: '/moved-permanently' })
				.post('/moved-permanently')
				.reply(302, undefined, { location: '/found' })
				.post('/found')
				.reply((path, body) => {
					assert.equal(body, 'initial request body');
					return [ 303, undefined, { location: '/see-other' } ];
				})
				.get('/see-other')
				.reply((path, body) => {
					if (body) assert.fail('unexpected body');
					return [ 200 ];
				});

			const response = await browser.fetch(url, {
				method: 'post',
				body: 'initial request body',
			});
			assert.equal(response.status, 200);
		});

		it('persists cookies and body through redirect chain', async () => {
			nock(url.origin)
				.post(url.pathname + url.search)
				.reply(308, undefined, {
					'location': '/secure-location',
					'set-cookie': 'logged-in=1; path=/; httponly',
				})
				.post('/secure-location')
				.reply(303, undefined, { location: '/final-location' })
				.get('/final-location')
				.reply(function () {
					const headers = { ...this.req.headers };
					delete headers.host;
					assert.deepEqual(headers, { cookie: 'logged-in=1' });
					return [ 200 ];
				});

			const response = await browser.fetch(url, {
				method: 'post',
				headers: { irrelevant: 'header' },
			});
			assert.equal(response.status, 200);
		});
	});

	describe('.load()', () => {
		const origin = 'http://example.com';
		const browser = new Browser(origin);

		it('loads document from string', async () => {
			const dom = await browser.load('<title>Document from string');
			assert(dom.window.document.title, 'Document from string');
		});

		it('loads document from response', async () => {
			nock(origin)
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

		it('loads detailed document from response', async () => {
			nock(origin)
				.get('/xml-document')
				.reply(
					200,
					'<xml><land><zombie /></land></xml>',
					{ 'content-type': 'application/xml' }
				);
			const pendingResponse = browser.fetch('/xml-document');
			const dom = await browser.load(pendingResponse);
			assert.equal(dom.window.location.href, origin + '/xml-document');
			assert.equal(dom.window.document.contentType, 'application/xml');
		});
	});
});
