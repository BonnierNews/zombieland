import assert from 'node:assert/strict';
import path from 'node:path';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser, ResourceLoader } from '../../index.js';

Feature('source code resource', () => {
	const pendingServerOrigin = setup(server);

	let resources;
	Given('a source document', () => {
		resources = new ResourceLoader({
			resolveTag (tag) {
				const src = tag.src || tag.dataset.sourceFile;
				if (src?.endsWith('/dist-bundle.js')) {
					return import.meta.resolve(path.join(import.meta.dirname, 'source-entry.mjs'));
				}
			}
		});
	});

	let serverOrigin, dom;
	When('load page', async () => {
		serverOrigin = await pendingServerOrigin;
		dom = await new Browser(serverOrigin)
			.navigateTo('/', {}, {
				resources,
			});
	});

	And('a script referencing a bundle', () => {
		const script = dom.window.document.querySelector('script[src]');
		assert.ok(script);
		assert.equal(script.src, new URL('/dist-bundle.js', serverOrigin).href);
	});

	And('an inline script marked: sourced from a file', () => {
		const script = dom.window.document.querySelector('script[data-source-file]');
		assert.ok(script);
		assert.equal(script.dataset.sourceFile, '/dist-bundle.js');
	});

	And('another inline script', () => {
		const script = dom.window.document.querySelector('script:not([src], [data-src])');
		assert.ok(script);
		assert.equal(script.text.trim().length > 0, true);
	});

	When('scripts are executed', async () => {
		assert.equal(dom.window.document.title, 'Document');
		await resources.runScripts(dom);
	});

	Then('source files and inline scripts have been executed', () => {
		assert.equal(dom.window.document.title, [
			'Document',
			'edit from source entry',
			'edit from source component',
			'edit from source entry',
			'edit from source component',
			'edit from inline script',
		].join(', '));
	});
});
