import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

export default http.createServer(async (req, res) => {
	try {
		let document;
		if (req.url === '/secondary-content') {
			document = '<h1>Secondary content</h1>\n…';
		}
		else {
			const documentPath = path.resolve('./examples/polyfill/document.html');
			document = await fs.readFile(documentPath, 'utf8');
		}
		res
			.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
			.end(document);
	}
	catch (err) {
		res.writeHead(500).end(err.stack);
	}
});
