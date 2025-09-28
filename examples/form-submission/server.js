import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

export default http.createServer(async (req, res) => {
	try {
		switch (req.method + ':' + req.url) {
			case 'GET:/':
				return await index(req, res);
			case 'POST:/sign-in':
				return await signIn(req, res);
		}
	}
	catch (error) {
		res.writeHead(500).end(error.stack);
	}
});

async function index (req, res) {
	const signedIn = req.headers.cookie?.includes('signed-in=true');
	const documentPath = signedIn ?
		path.resolve('./examples/form-submission/document-welcome.html') :
		path.resolve('./examples/form-submission/document-sign-in.html');
	const document = await fs.readFile(documentPath, 'utf8');
	res
		.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
		.end(document);
}

async function signIn (req, res) {
	let body = '';
	for await (const chunk of req) {
		body += chunk.toString();
	}

	const formData = {};
	for (const key of [ 'email', 'password' ]) {
		const value = new RegExp(`name="${key}"(?:\r\n)+(.*)`).exec(body)?.[1];
		formData[key] = value;
	}

	const authenticated = formData.email === 'tallahassee@zombieland.zl' &&
		formData.password === 'banjo';

	const headers = {};
	headers.location = '/';
	if (authenticated) {
		headers['set-cookie'] = 'signed-in=true';
	}

	res
		.writeHead(303, headers)
		.end();
}
