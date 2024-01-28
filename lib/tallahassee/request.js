'use strict';

const http = require('http');
const https = require('https');

module.exports = function request (url, { body: reqBody, ...options }) {
	return new Promise((resolve, reject) => {
		url = new URL(url);
		const h = url.protocol === 'https:' ? https : http;
		const req = h.request(url, options, onResponse);
		req.on('error', reject);
		if (reqBody) req.write(reqBody);
		req.end();

		function onResponse (res) {
			const { statusCode, headers } = res;
			let resBody = '';
			res.on('data', chunk => resBody += chunk.toString());
			res.on('end', () => resolve({
				url,
				statusCode,
				headers,
				body: resBody,
				toString () {
					return this.body;
				}
			}));
		}
	});
};
