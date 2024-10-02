import assert from 'node:assert/strict';
import Module from '../module.js';

describe('module', () => {
	it('evaluates source code in a given context', async () => {
		const module = new Module(`
			document.title += ', edit from script';
		`);
		const document = { title: 'initial value' };
		await module.evaluate({ document });

		assert.equal(document.title, 'initial value, edit from script');
	});

	it('resolves imports', async () => {
		const module = new Module(`
			import component from 'lib/wichita/test/files/source-component.mjs';
			import * as npmModule from 'assertion-error';
			if (npmModule)
				document.title += ', edit based on npm module';
			component();
		`);
		const document = { title: 'initial value' };
		await module.evaluate({ document });
		assert.equal(document.title, 'initial value, edit based on npm module, edit from source component');
	});

	it('returns exports', async () => {
		const module = new Module(`
			export default document.title + '?';
			export const named = document.title + '!';
		`);
		const exports = await module.evaluate({
			document: { title: 'with exports' },
		});
		assert.equal(exports.default, 'with exports?');
		assert.equal(exports.named, 'with exports!');
	});

	it('accepts a path to a file', async () => {
		const module = new Module('lib/wichita/test/files/source-entry.mjs');
		const document = { title: 'initial value' };
		await module.evaluate({ document });
		assert.equal(document.title, 'initial value, edit from source entry, edit from source component');
	});

	it('may be evaluated multiple times', async () => {
		const module = new Module(`
			export default document.title + '!';
		`);
		const exports = await Promise.all([
			module.evaluate({ document: { title: 'once' } }),
			module.evaluate({ document: { title: 'twice' } }),
		]);
		assert.equal(exports[0].default, 'once!');
		assert.equal(exports[1].default, 'twice!');
	});
});
