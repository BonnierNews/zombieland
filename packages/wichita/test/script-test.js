import assert from 'node:assert/strict';
import Script from '../script.js';

describe('Script', () => {
	describe('.evaluate()', () => {
		it('evaluates code in a given context', async () => {
			const module = new Script(`
				document.title += ', edit from script';
			`);
			const document = { title: 'initial value' };
			await module.evaluate({ document });

			assert.equal(document.title, 'initial value, edit from script');
		});

		it('evaluates code with imports', async () => {
			const module = new Script('packages/wichita/test/script-test.js', `
				import component from './files/source-component.mjs';
				import * as npmModule from 'assertion-error';
				if (npmModule)
					document.title += ', edit based on npm module';
				component();
			`);
			const document = { title: 'initial value' };
			await module.evaluate({ document });
			assert.equal(document.title, 'initial value, edit based on npm module, edit from source component');
		});

		it('evaluates code with exports', async () => {
			const module = new Script(`
				export default document.title + '?';
				export const named = document.title + '!';
			`);
			const exports = await module.evaluate({
				document: { title: 'with exports' },
			});
			assert.equal(exports.default, 'with exports?');
			assert.equal(exports.named, 'with exports!');
		});

		it('evaluates code from path', async () => {
			const module = new Script('packages/wichita/test/files/source-entry.mjs');
			const document = { title: 'initial value' };
			await module.evaluate({ document });
			assert.equal(document.title, 'initial value, edit from source entry, edit from source component');
		});

		it('evaluates code multiple times', async () => {
			const module = new Script(`
				let i = 0;
				export default document.title + '!';
				export const times = ++i;
			`);
			const exports = await Promise.all([
				module.evaluate({ document: { title: 'once' } }),
				module.evaluate({ document: { title: 'twice' } }),
			]);
			assert.equal(exports[0].default, 'once!');
			assert.equal(exports[1].default, 'twice!');
			assert.equal(exports[1].times, 1);
		});
	});
});
