import assert from 'assert/strict';
import server from './server.js';
import setup from '../helpers/setup.js';
import { Browser, Painter, Resources } from '../../index.js';

Feature('infinite scroll', () => {
	const pendingServerOrigin = setup(server);

	let painter, resources, dom;
	before('load page', async () => {
		painter = new Painter();
		resources = new Resources();

		const origin = await pendingServerOrigin;
		dom = await new Browser(origin)
			.navigateTo('/', {}, {
				resources,
				painter,
			});
	});

	let articles;
	Given('one article', () => {
		articles = dom.window.document.getElementsByTagName('article');
		assert.equal(articles.length, 1);
		painter.paint('article', { height: dom.window.innerHeight * 2, y: 'auto' }, dom.window);
	});

	When('scripts are executed', async () => {
		await resources.runScripts(dom);
	});

	let resolvePendingInsertion;
	And('mutations to body are monitored', () => {
		const observer = new dom.window.MutationObserver(() => resolvePendingInsertion());
		observer.observe(dom.window.document.body, { childList: true });
	});

	let pendingInsertion;
	And('document is scrolled towards the end of the article', () => {
		pendingInsertion = new Promise(resolve => resolvePendingInsertion = resolve);
		const { bottom: articleBottom } = articles[0].getBoundingClientRect();
		dom.window.scroll(0, articleBottom - (dom.window.innerHeight / 2));
	});

	Then('a second article is appended', async () => {
		await pendingInsertion;
		assert.equal(articles.length, 2);
	});

	When('document is scrolled towards the end of the second article', () => {
		pendingInsertion = new Promise(resolve => resolvePendingInsertion = resolve);
		const { bottom: articleBottom } = articles[1].getBoundingClientRect();
		dom.window.scroll(0, articleBottom - (dom.window.innerHeight / 2));
	});

	Then('a third article is appended', async () => {
		await pendingInsertion;
		assert.equal(articles.length, 3);
	});
});
