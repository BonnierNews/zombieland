import assert from 'node:assert/strict';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser } from '../../zombieland.js';

Feature('Link navigation', () => {
	const pendingServerOrigin = setup(server);

	let browser, dom;
	before('load page', async () => {
		const origin = await pendingServerOrigin;
		browser = new Browser(origin);
		dom = await browser.navigateTo('/', {}, {
			runScripts: 'dangerously',
			beforeParse (window) {
				Object.defineProperties(window.HTMLDialogElement.prototype, {
					showModal: { value: dialogShowModal },
					close: { value: dialogClose },
					open: { get: dialogOpen, set: dialogOpen },
				});
			}
		});

		function dialogShowModal () {
			this.open = true;
		}

		function dialogClose () {
			this.open = false;
		}

		function dialogOpen (value) {
			if (!arguments.length) return this.hasAttribute('open');

			if (value) this.setAttribute('open', '');
			else this.removeAttribute('open');
		}
	});

	let links;
	Given('a menu with links', () => {
		links = dom.window.document.querySelectorAll('nav a');
		assert(links.length >= 2);
	});

	describe('Button link', () => {
		let buttonLink;
		Given('one acts as a button by javascript', () => {
			[ buttonLink ] = links;
			assert.equal(buttonLink.getAttribute('href'), '#big-menu');
			assert.equal(buttonLink.role, 'button');
		});

		let dialog;
		And('it links to another menu in a closed dialog', () => {
			dialog = dom.window.document.querySelector('#big-menu')?.closest('dialog');
			assert.ok(dialog);
			assert.equal(dialog.open, false);
		});

		let pendingRequest;
		When('clicking the link', () => {
			pendingRequest = browser.captureNavigation(dom);
			buttonLink.click();
		});

		Then('no navigation occurs', async () => {
			await assert.rejects(pendingRequest);
		});

		And('the dialog is shown', () => {
			assert(dialog.open);
		});
	});

	describe('Regular link', () => {
		let regularLink;
		Given('one is a regular link', () => {
			[ , regularLink ] = links;
			assert.equal(regularLink.getAttribute('href'), '/page-1');
		});

		let pendingResponse, pagehideTriggered = 0;
		When('clicking the link', () => {
			pendingResponse = browser.captureNavigation(dom, true);
			dom.window.addEventListener('pagehide', () => ++pagehideTriggered);
			regularLink.click();
		});

		Then('navigation occurs', async () => {
			const response = await pendingResponse;
			assert.ok(response);
			assert(response instanceof Response);
			assert.equal(response.url, regularLink.href);
		});

		And('page is closed', () => {
			assert.equal(pagehideTriggered, 1);
		});
	});
});
