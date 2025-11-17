import assert from 'node:assert/strict';
import Script from '../script.js';
import { JSDOM } from 'jsdom';

describe('Script', () => {
	describe('.evaluate()', () => {
		it('evaluates script from file path', async () => {
			const module = new Script(import.meta.dirname + '/files/source-entry.mjs');
			const dom = new JSDOM('<title>initial value</title>');

			await module.evaluate(dom.window);

			assert.equal(dom.window.document.title, 'initial value, edit from source entry, edit from source component');
		});

		it('evaluates script from code', async () => {
			const module = new Script(`
				document.title += ', edit from script';
			`);
			const dom = new JSDOM('<title>initial value</title>');

			await module.evaluate(dom.window);

			assert.equal(dom.window.document.title, 'initial value, edit from script');
		});

		it('evaluates script with imports', async function () {
			const module = new Script(getTestPath(this), `
				import component from './files/source-component.mjs';
				import packageComponent from 'package-component';
				component();
				packageComponent();
			`);
			const dom = new JSDOM('<title>initial value</title>');

			await module.evaluate(dom.window);

			assert.equal(dom.window.document.title, 'initial value, edit from source component, edit from package component');
		});

		it('evaluates script with exports', async function () {
			const module = new Script(getTestPath(this), `
				export default document.title + '?';
				export const named = document.title + '!';
			`);
			const dom = new JSDOM('<title>with exports</title>');

			const exports = await module.evaluate(dom.window);

			assert.equal(exports.default, 'with exports?');
			assert.equal(exports.named, 'with exports!');
		});

		it('evaluates script multiple times', async function () {
			const module = new Script(getTestPath(this), `
				let i = 0;
				export default document.title + '!';
				export const times = ++i;
			`);

			const exports = await Promise.all([
				module.evaluate(new JSDOM('<title>once</title>').window),
				module.evaluate(new JSDOM('<title>twice</title>').window),
			]);

			assert.equal(exports[0].default, 'once!');
			assert.equal(exports[1].default, 'twice!');
			assert.equal(exports[1].times, 1);
		});
	});
});

function getTestPath (context) {
	return import.meta.filename + '?' + new URLSearchParams({
		test: context.test.title
	});
}
