import assert from 'node:assert/strict';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser, jsdom } from '../../zombieland.js';

Feature('form submission', () => {
	const pendingServerOrigin = setup(server);

	Scenario('Browser validation', () => {
		let serverOrigin, browser, dom;
		before('load page without scripts', async () => {
			serverOrigin = await pendingServerOrigin;
			browser = new Browser(serverOrigin);
			dom = await browser.navigateTo('/');
		});

		let form, emailField, passwordField, submitButton;
		Given('a sign in form', () => {
			const headline = dom.window.document.querySelector('h1');
			assert.equal(headline?.textContent, 'Sign in');

			form = dom.window.document.querySelector('form');
			assert.ok(form);
			assert.equal(form.elements.length, 3);
			[ emailField, passwordField, submitButton ] = form.elements;
		});

		And('user fills out form incorrectly', () => {
			emailField.value = 'not an email';
		});

		let pendingResponse, pagehideTriggered = 0;
		When('submitting form', () => {
			dom.window.addEventListener('pagehide', () => ++pagehideTriggered);
			pendingResponse = browser.captureNavigation(dom, true);
			submitButton.click();
		});

		Then('no navigation occurs', async () => {
			await assert.rejects(pendingResponse, event => {
				assert(event instanceof dom.window.Event);
				assert.equal(event.type, 'invalid');
				assert.equal(event.target, emailField);
				return true;
			});
			assert.equal(pagehideTriggered, 0);
			assert.ok(dom.window.document);
		});

		Given('user fills out form correctly', () => {
			emailField.value = 'tallahassee@zombieland.zl';
			passwordField.value = 'banjo';
		});

		When('submitting form', () => {
			pendingResponse = browser.captureNavigation(dom, true);
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

	Scenario('Custom validation', () => {
		let serverOrigin, browser, dom;
		before('load page with scripts', async () => {
			serverOrigin = await pendingServerOrigin;
			browser = new Browser(serverOrigin);
			dom = await browser.navigateTo('/', {}, {
				runScripts: 'dangerously',
			});
		});

		let form, emailField, passwordField, submitButton;
		Given('a sign in form', () => {
			const headline = dom.window.document.querySelector('h1');
			assert.equal(headline?.textContent, 'Sign in');

			form = dom.window.document.querySelector('form');
			assert.ok(form);
			assert.equal(form.elements.length, 3);
			[ emailField, passwordField, submitButton ] = form.elements;
		});

		And('user fills out form correctly', () => {
			emailField.value = 'tallahassee@zombieland.zl';
			passwordField.value = 'banjo';
		});

		But('some external validation fails', () => {
			// something that prevents 'submit' without triggering 'invalid'
			dom.window.externalCAPTCHA = () => false;
		});

		let pendingResponse, pagehideTriggered = 0;
		When('submitting form', () => {
			dom.window.addEventListener('pagehide', () => ++pagehideTriggered);
			pendingResponse = browser.captureNavigation(dom, true);
			submitButton.click();
		});

		Then('no navigation occurs', async () => {
			await assert.rejects(pendingResponse, event => {
				assert(event instanceof dom.window.Event);
				assert.equal(event.type, 'submit')
				assert.equal(event.defaultPrevented, true);
				return true;
			});
			assert.equal(pagehideTriggered, 0);
			assert.ok(dom.window.document);
		});

		Given('some external validation succeeds', () => {
			dom.window.externalCAPTCHA = () => true;
		});

		When('submitting form', () => {
			pendingResponse = browser.captureNavigation(dom, true);
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
});
