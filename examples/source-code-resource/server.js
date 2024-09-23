import fs from 'fs/promises';
import http from 'http';
import path from 'path';

export default http.createServer(async (req, res) => {
	try {
		const documentPath = path.resolve('./examples/source-code-resource/document.html');
		const document = await fs.readFile(documentPath, 'utf8');
		res
			.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
			.end(document);
	}
	catch (err) {
		res.writeHead(500).end(err.stack);
	}
});
