'use strict';

const nock = require('nock');
const request = require('./request.js');

const httpVerbs = [ 'DELETE', 'GET', 'HEAD', 'MERGE', 'OPTIONS', 'PATCH', 'POST', 'PUT' ];

module.exports = class ReverseProxy {
	#interceptors = [];

	constructor (proxyOrigin, upstreamOrigin, headers = {}) {
		this.upstreamOrigin = upstreamOrigin;
		this.headers = headers;

		const proxy = this;
		for (const verb of httpVerbs) {
			const interceptor = nock(proxyOrigin)
				.persist()
				.intercept(/.*/, verb);
			interceptor.reply(function (path, body, callback) {
				proxy.#forward.call(proxy, this.req, path, body, function (...args) {
					console.log(args);
					callback.call(this, ...args);
				});
			});
			this.#interceptors.push(interceptor);
		}
	}

	clear () {
		for (const interceptor of this.#interceptors)
			nock.removeInterceptor(interceptor);
	}

	async #forward (req, path, body, callback) {
		console.log('forward', path);
		const { method, headers: reqHeaders } = req;
		const headers = { ...this.headers, ...reqHeaders };

		console.log(headers);
		try {
			const res = await fetch(new URL(path, this.upstreamOrigin), {
				method,
				headers,
				...(body ? { body } : undefined),
			});
			callback(null, [
				res.status,
				await res.text(),
				Object.fromEntries(res.headers.entries())
			]);
		}
		catch (error) {
			callback(error);
		}
	}
};
