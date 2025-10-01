import assert from 'node:assert';
import { Readable } from 'node:stream';

const fieldPattern = /form-data; name="(.*?)"\s+(.+)/gi;

export default async function parseFormData (req, contentType) {
	assert.equal(contentType, 'application/x-www-form-urlencoded');

	const body = await collectBody(req);

	let formData;
	for (const [ , name, value ] of body.matchAll(fieldPattern)) {
		formData ??= {};
		formData[name] = value;
	}

	return formData;
}

async function collectBody (req) {
	if (!(req instanceof Readable)) {
		return req.toString();
	}

	let body = '';
	for await (const chunk of req) {
		body += chunk.toString();
	}

	return body;
}
