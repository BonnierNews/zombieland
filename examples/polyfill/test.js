import assert from 'node:assert/strict';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser, ResourceLoader } from '../../index.js';

Feature('polyfill', () => {
	const pendingServerOrigin = setup(server);

	let pendingDOM;
	When('page loads in browser with polyfill', async () => {
		const origin = await pendingServerOrigin;
		pendingDOM = new Browser(origin)
			.navigateTo('/', {}, {
				runScripts: 'dangerously',
				beforeParse: window => {
					assert.equal('fetch' in window, false);
					ResourceLoader.polyfill(window);
				},
			});
	});

	let dom;
	And('scripts use natively missing APIs', async () => {
		dom = await pendingDOM;
		const script = dom.window.document.querySelector('script');
		assert.equal(/fetch\('[/\w-']+'\)/.test(script.innerHTML), true);
	});

	let aside, pendingInsertion;
	Then('initial document is ready', () => {
		aside = dom.window.document.querySelector('aside');
		assert.equal(aside.textContent.trim(), '(Loading…)');

		let resolvePendingInsertion;
		pendingInsertion = new Promise(resolve => resolvePendingInsertion = resolve);
		const observer = new dom.window.MutationObserver(() => resolvePendingInsertion());
		observer.observe(aside, { childList: true });
	});

	And('scripts were successfully executed', async () => {
		await pendingInsertion;
		assert.equal(aside.textContent.trim(), 'Secondary content\n…');
	});
});
