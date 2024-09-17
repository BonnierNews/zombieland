'use strict';

const assert = require('node:assert/strict');
const Browser = require('../browser.js');
const ReverseProxy = require('../reverse-proxy.js');
const nock = require('nock');

describe('ReverseProxy', () => {
	before(() => nock.disableNetConnect());
	beforeEach(() => nock.cleanAll());
	after(() => nock.enableNetConnect());

	const upstreamOrigin = 'http://localhost';
	const proxyOrigin = 'https://tallahassee.zl';

	it('proxies request to upstream origin', async () => {
		nock(upstreamOrigin)
			.get('/resource')
			.reply(200, 'response from upstream');

		// eslint-disable-next-line no-new
		new ReverseProxy(proxyOrigin, upstreamOrigin);

		const response = await fetch(new URL('/resource', proxyOrigin));
		assert.equal(response.status, 200);

		const responseBody = await response.text();
		assert.equal(responseBody, 'response from upstream');
	});

	it('proxies request with headers', async () => {
		nock(upstreamOrigin)
			.get('/resource')
			.reply(function () {
				const { headers } = this.req;
				assert.equal(headers.host, 'tallahassee.zl');
				assert.equal(headers['x-forwarded-proto'], 'https');
				assert.equal(headers['x-forwarded-host'], 'tallahassee.zl');
				assert.equal(headers['req-header'], 'value');
				return [ 200 ];
			});

		// eslint-disable-next-line no-new
		new ReverseProxy(proxyOrigin, upstreamOrigin, {
			'x-forwarded-proto': 'https',
			'x-forwarded-host': 'tallahassee.zl',
		});

		const response = await fetch(new URL('/resource', proxyOrigin), {
			headers: { 'req-header': 'value' },
		});
		assert.equal(response.status, 200);
	});

	it('proxies request with body', async () => {
		nock(upstreamOrigin)
			.post('/resource')
			.reply((path, body) => {
				assert.equal(body, 'request body');
				return [ 200 ];
			});

		// eslint-disable-next-line no-new
		new ReverseProxy(proxyOrigin, upstreamOrigin);

		const response = await fetch(new URL('/resource', proxyOrigin), {
			method: 'post',
			body: 'request body',
		});
		assert.equal(response.status, 200);
	});

	[
		'DELETE',
		'GET',
		'HEAD',
		'MERGE',
		'OPTIONS',
		'PATCH',
		'POST',
		'PUT'
	].forEach(method => {
		it(`proxies request with method ${method}`, async () => {
			nock(upstreamOrigin)
				.intercept('/resource', method)
				.reply(200);

			// eslint-disable-next-line no-new
			new ReverseProxy(proxyOrigin, upstreamOrigin);

			const response = await fetch(new URL('/resource', proxyOrigin), { method });
			assert.equal(response.status, 200);
		});
	});

	it('proxies requests until cleared', async () => {
		nock(upstreamOrigin)
			.get('/resource')
			.reply(200)
			.persist();

		const proxy = new ReverseProxy(proxyOrigin, upstreamOrigin);

		for (let i = 0; i < 3; i++) {
			const response = await fetch(new URL('/resource', proxyOrigin));
			assert.equal(response.status, 200);
		}

		proxy.clear();

		await assert.rejects(fetch(new URL('/resource', proxyOrigin)));

		const upstreamResponse = await fetch(new URL('/resource', upstreamOrigin));
		assert.equal(upstreamResponse.status, 200);
	});

	it('proxies requests from browser, document and web page', async () => {
		nock(upstreamOrigin)
			.get('/document')
			.reply(200, `
				<!doctype html>
				<title>Document from upstream</title>
				<iframe src="/sub-document"></iframe>
				<script>
					const req = new XMLHttpRequest();
					req.open("GET", "/data");
					req.addEventListener("load", function () {
						const data = JSON.parse(this.responseText);
						document.title += ', ' + data.title;
						window.dispatchEvent(new Event("fetchresponse"));
					});
					req.send();
				</script>
			`)
			.get('/sub-document')
			.reply(200, `
				<!doctype html>
				<title>Sub-document from upstream</title>
			`)
			.get('/data')
			.reply(200, { title: 'Data from upstream' });

		// eslint-disable-next-line no-new
		new ReverseProxy(proxyOrigin, upstreamOrigin);
		const browser = new Browser(proxyOrigin);
		const dom = await browser.navigateTo('/document', {}, {
			resources: 'usable',
			runScripts: 'dangerously',
		});
		await Promise.all([
			new Promise(r => dom.window.addEventListener('load', r)),
			new Promise(r => dom.window.addEventListener('fetchresponse', r)),
		]);

		assert.equal(dom.window.document.title, 'Document from upstream, Data from upstream');
		assert.equal(dom.window.frames[0].document.title, 'Sub-document from upstream');
	});
});
