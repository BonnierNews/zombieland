import assert from 'node:assert/strict';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser, jsdom } from '../../zombieland.js';

Feature('form submission', () => {
	const pendingServerOrigin = setup(server);

	let serverOrigin, browser, dom;
	before('load page', async () => {
		serverOrigin = await pendingServerOrigin;
		browser = new Browser(serverOrigin);
		dom = await browser.navigateTo('/', {}, {
			virtualConsole: new jsdom.VirtualConsole()
		});
	});

	let form;
	Given('a sign in form', () => {
		const headline = dom.window.document.querySelector('h1');
		assert.equal(headline?.textContent, 'Sign in');

		form = dom.window.document.querySelector('form');
		assert.ok(form);
		assert.equal(form.elements.length, 3);
	});

	And('user fills out form', () => {
		const [ emailField, passwordField ] = form.elements;
		emailField.value = 'tallahassee@zombieland.zl';
		passwordField.value = 'banjo';
	});

	let pendingResponse, pagehideTriggered = 0;
	When('submitting form', () => {
		dom.window.addEventListener('pagehide', () => ++pagehideTriggered);
		pendingResponse = browser.captureNavigation(dom);
		const [ , , submitButton ] = form.elements;
		submitButton.click();
	});

	Then('first page is closed', () => {
		assert.equal(pagehideTriggered, 1);
		assert.equal(dom.window.document, undefined);
	});

	And('navigation occurs', async () => {
		const response = await pendingResponse;
		assert.ok(response);
		assert(response instanceof Response);
		dom = await browser.load(response);
	});

	And('user is signed in', () => {
		const headline = dom.window.document.querySelector('h1');
		assert.equal(headline?.textContent, 'Welcome');
	});
});
