import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

export default http.createServer(async (req, res) => {
	try {
		const cookie = req.headers.cookie || '';
		if (!cookie.includes('loggedIn=1')) {
			return res.writeHead(401).end();
		}

		const documentPath = path.resolve('./examples/persistent-cookies/document.html');
		const document = await fs.readFile(documentPath, 'utf8');
		res
			.writeHead(200, {
				'content-type': 'text/html; charset=utf-8',
				'set-cookie': incrementValue(cookie, 'incremental'),
			})
			.end(document);
	}
	catch (err) {
		res.writeHead(500).end(err.stack);
	}
});

function incrementValue (cookie, name) {
	const pattern = new RegExp(`${name}=(\\d)`);
	const value = cookie.match(pattern)?.[1];
	return `${name}=${Number(value || -1) + 1}`;
}
