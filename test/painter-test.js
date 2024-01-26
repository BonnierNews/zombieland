'use strict';

const Painter = require('../lib/painter.js');
const pick = require('lodash.pick');
const { JSDOM } = require('jsdom');
const { strict: assert } = require('assert');

describe('Painter', () => {
	describe('Web APIs', () => {
		let dom, window, element;
		beforeEach('load DOM', () => {
			dom = new JSDOM('<div>HTMLElement</div>', { runScripts: 'outside-only' });
			window = dom.window;
			element = window.document.querySelector('div');
		});

		let painter;
		beforeEach('initialize painter', () => {
			painter = new Painter().init(window);
		});

		beforeEach('paint non-default scroll position', () => {
			painter.paint(window, {
				scrollX: 20,
				scrollY: 10,
			});
		});

		beforeEach('paint non-default layout', () => {
			painter.paint(element, {
				width: 150,
				height: 250,
				scrollWidth: 450,
				scrollHeight: 300,
				x: 50,
				y: 20,
				scrollX: 20,
				scrollY: 10,
			});
		});

		describe('Element', () => {
			beforeEach('is instance of Element', () => {
				assert.equal(element instanceof dom.window.Element, true, 'expected instance of Element');
			});

			it('.scrollWidth', () => {
				assert.equal(element.scrollWidth, 450);
			});

			it('.scrollHeight', () => {
				assert.equal(element.scrollHeight, 300);
			});

			it('.scrollLeft', () => {
				assert.equal(element.scrollLeft, 20);
			});

			it('.scrollTop', () => {
				assert.equal(element.scrollTop, 10);
			});

			it('.getBoundingClientRect()', () => {
				assert.deepEqual(element.getBoundingClientRect(), {
					width: 150,
					height: 250,
					x: 30,
					y: 10,
					left: 30,
					right: 180,
					top: 10,
					bottom: 260,
				});
			});

			it('.scroll(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scroll(30, 50);
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 50);

				return pendingScroll;
			});

			it('.scroll(options)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scroll({ left: 30, top: 50 });
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 50);

				return pendingScroll;
			});

			it('.scrollTo(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scrollTo(30, 50);
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 50);

				return pendingScroll;
			});

			it('.scrollTo(options)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scrollTo({ left: 30, top: 50 });
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 50);

				return pendingScroll;
			});

			it('.scrollBy(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scrollBy(10, 10);
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 20);

				return pendingScroll;
			});

			it('.scrollBy(options)', () => {
				const pendingScroll = new Promise(r =>
					element.addEventListener('scroll', r, { once: true })
				);

				element.scrollBy({ left: 10, top: 10 });
				assert.equal(element.scrollLeft, 30);
				assert.equal(element.scrollTop, 20);

				return pendingScroll;
			});
		});

		describe('HTMLElement', () => {
			beforeEach('is instance of HTMLElement', () => {
				assert.equal(element instanceof dom.window.HTMLElement, true, 'expected instance of HTMLElement');
			});

			it('.offsetWidth', () => {
				assert.equal(element.offsetWidth, 150);
			});

			it('.offsetHeight', () => {
				assert.equal(element.offsetHeight, 250);
			});

			it('.offsetLeft', () => {
				assert.equal(element.offsetLeft, 50);
			});

			it('.offsetTop', () => {
				assert.equal(element.offsetTop, 20);
			});
		});

		describe('Window', () => {
			beforeEach('paint non-default viewport', () => {
				painter.paint(window, {
					width: 900,
					height: 1600,
					scrollWidth: 1000,
					scrollHeight: 2000,
				});
			});

			it('.innerWidth', () => {
				assert.equal(window.innerWidth, 900);
			});

			it('.innerHeight', () => {
				assert.equal(window.innerHeight, 1600);
			});

			it('.scrollX', () => {
				assert.equal(window.scrollX, 20);
			});

			it('.scrollY', () => {
				assert.equal(window.scrollY, 10);
			});

			it('.pageXOffset', () => {
				assert.equal(window.pageXOffset, 20);
			});

			it('.pageYOffset', () => {
				assert.equal(window.pageYOffset, 10);
			});

			it('.scroll(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scroll(30, 60);
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 60);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 60);

				return pendingScroll;
			});

			it('.scroll(options)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scroll({ left: 30, top: 60 });
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 60);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 60);

				return pendingScroll;
			});

			it('.scrollTo(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scrollTo(30, 60);
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 60);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 60);

				return pendingScroll;
			});

			it('.scrollTo(options)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scrollTo({ left: 30, top: 60 });
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 60);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 60);

				return pendingScroll;
			});

			it('.scrollBy(x-coord, y-coord)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scrollBy(10, 10);
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 20);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 20);

				return pendingScroll;
			});

			it('.scrollBy(options)', () => {
				const pendingScroll = new Promise(r =>
					window.addEventListener('scroll', r, { once: true })
				);

				window.scrollBy({ left: 10, top: 10 });
				assert.equal(window.scrollX, 30);
				assert.equal(window.scrollY, 20);
				assert.equal(window.pageXOffset, 30);
				assert.equal(window.pageYOffset, 20);

				return pendingScroll;
			});
		});
	});

	describe('scrolling', () => {
		let dom, window, ancestorElement, parentElement, childElements;
		beforeEach('load DOM', () => {
			dom = new JSDOM(`
				<article>
					<div>
						<img>
						<img>
					</div>
				</article>
			`, { runScripts: 'outside-only' });
			window = dom.window;
			ancestorElement = window.document.querySelector('article');
			parentElement = ancestorElement.firstElementChild;
			childElements = parentElement.children;
		});

		let painter;
		beforeEach('initialize painter', () => {
			painter = new Painter().init(window);
		});

		beforeEach('paint layout', () => {
			painter.paint(ancestorElement, { width: 400, y: 50 });
			painter.paint(parentElement, { width: 400, y: 70 }, ancestorElement);
			painter.paint(childElements[0], { x: 0, width: 400, y: 70 }, parentElement);
			painter.paint(childElements[1], { x: 400, width: 400, y: 70 }, parentElement);
		});

		it('scrolling window paints descendants', () => {
			dom.window.scrollTo(0, 50);

			assert.deepEqual(
				pick(ancestorElement.getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 0 }
			);
			assert.deepEqual(
				pick(parentElement.getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 20 }
			);
			assert.deepEqual(
				pick(childElements[0].getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 20 }
			);
			assert.deepEqual(
				pick(childElements[1].getBoundingClientRect(), 'x', 'y'),
				{ x: 400, y: 20 }
			);
		});

		it('scrolling ancestor paints descendants', () => {
			ancestorElement.scrollTo(0, 50);
			parentElement.scrollTo(400, 0);

			assert.deepEqual(
				pick(ancestorElement.getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 50 }
			);
			assert.deepEqual(
				pick(parentElement.getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 20 }
			);
			assert.deepEqual(
				pick(childElements[0].getBoundingClientRect(), 'x', 'y'),
				{ x: -400, y: 20 }
			);
			assert.deepEqual(
				pick(childElements[1].getBoundingClientRect(), 'x', 'y'),
				{ x: 0, y: 20 }
			);
		});
	});

	describe('options.stylesheet', () => {
		before('defaults bounding box values to 0', async () => {
			const dom = new JSDOM('<div>HTMLElement</div>');
			new Painter().init(dom.window);

			const element = dom.window.document.querySelector('div');
			assert.deepEqual(element.getBoundingClientRect(), {
				width: 0,
				height: 0,
				x: 0,
				y: 0,
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
			});
		});

		it('styles multiple elements', async () => {
			const dom = new JSDOM(`
				<div>HTMLElement</div>
				<div>HTMLElement</div>
			`);
			const stylesheet = {
				'*': { x: 50, y: 20, width: 150, height: 250 },
			};
			new Painter({ stylesheet }).init(dom.window);

			const matchingElements = dom.window.document.querySelectorAll('*');
			for (const element of matchingElements) {
				assert.deepEqual(element.getBoundingClientRect(), {
					width: 150,
					height: 250,
					x: 50,
					y: 20,
					left: 50,
					right: 200,
					top: 20,
					bottom: 270,
				});
			}
		});

		it('compounds multiple matching styles', async () => {
			const dom = new JSDOM(`
				<h1>A heading</h1>
				<p>A paragraph…</p>
			`);
			const stylesheet = {
				'*': { width: 375 },
				'h1': { height: 36 },
				'p': { height: 160, y: 36 },
			};
			new Painter({ stylesheet }).init(dom.window);

			const [ h1, p ] = dom.window.document.body.children;
			assert.deepEqual(h1.getBoundingClientRect(), {
				width: 375,
				height: 36,
				x: 0,
				y: 0,
				left: 0,
				right: 375,
				top: 0,
				bottom: 36,
			});
			assert.deepEqual(p.getBoundingClientRect(), {
				width: 375,
				height: 160,
				x: 0,
				y: 36,
				left: 0,
				right: 375,
				top: 36,
				bottom: 196,
			});
		});

		it('uses selector specificity to resolve conflicting styles', async () => {
			const dom = new JSDOM(`
				<h1 id="the-heading" class="heading">
					A heading
				</h1>
			`);
			const stylesheet = {
				'#the-heading': { height: 30 },
				'h1, h2': { height: 10 },
				'.heading': { height: 20 },
				'*': { height: 0 },
			};
			new Painter({ stylesheet }).init(dom.window);

			const h1 = dom.window.document.body.querySelector('h1');
			assert.deepEqual(h1.offsetHeight, 30);
		});

		it('element styles trump stylesheet styles', async () => {
			const dom = new JSDOM(`
				<div id="element">HTMLElement</div>
			`);
			const stylesheet = {
				'#element': { width: 100, height: 100 },
			};
			const painter = new Painter({ stylesheet }).init(dom.window);

			const element = dom.window.document.getElementById('element');
			painter.paint(element, { width: 200 });
			assert.deepEqual(element.offsetWidth, 200);
			assert.deepEqual(element.offsetHeight, 100);
		});
	});

	describe('.paint', () => {
		let painter, divs, spans, elements;
		beforeEach(() => {
			const dom = new JSDOM(`
				<div>HTMLElement</div>
				<span>HTMLSpanElement</span>
			`);
			painter = new Painter().init(dom.window);
			divs = dom.window.document.querySelectorAll('div');
			spans = dom.window.document.querySelectorAll('span');
			elements = dom.window.document.querySelectorAll('*');
		});

		it('paints element', () => {
			const [ element ] = elements;
			painter.paint(element, { height: 16, y: 10 });

			assert.equal(element.offsetHeight, 16);
			assert.equal(element.offsetTop, 10);
		});

		it('paints elements with selector', () => {
			painter.paint('div', { height: 16, y: 10 });

			for (const div of divs) {
				assert.equal(div.offsetHeight, 16);
				assert.equal(div.offsetTop, 10);
			}
			for (const span of spans) {
				assert.equal(span.offsetHeight, 0);
				assert.equal(span.offsetTop, 0);
			}
		});

		it('repaints element, updating element styles', () => {
			const [ element ] = elements;
			painter.paint(element, { height: 16, y: 10 });

			assert.equal(element.offsetHeight, 16);
			assert.equal(element.offsetTop, 10);

			painter.paint(element, { height: 32 });

			assert.equal(element.offsetHeight, 32);
			assert.equal(element.offsetTop, 10);
		});

		it('repaints elements with selector, replacing stylesheet entry', () => {
			painter.paint('div', { height: 16, y: 10 });
			painter.paint('span', { height: 6, y: 1 });

			for (const div of divs) {
				assert.equal(div.offsetHeight, 16);
				assert.equal(div.offsetTop, 10);
			}
			for (const span of spans) {
				assert.equal(span.offsetHeight, 6);
				assert.equal(span.offsetTop, 1);
			}

			painter.paint('div', { height: 32 });

			for (const div of divs) {
				assert.equal(div.offsetHeight, 32);
				assert.equal(div.offsetTop, 0);
			}
			for (const span of spans) {
				assert.equal(span.offsetHeight, 6);
				assert.equal(span.offsetTop, 1);
			}
		});
	});

	describe('automatic layout', () => {
		let t = 0;
		class Tag {
			id = t++;
			name = '';
			parent = null;
			children = [];
			styles = {};
			constructor (name, styles, children = []) {
				this.name = name;
				this.children.push(...children);
				for (const c of children) {
					c.parent = this;
				}
				Object.assign(this.styles, styles);
			}
		}

		const axes = [ 'x', 'y' ];
		const sides = [ 'width', 'height' ];
		const scrollSides = [ 'scrollWidth', 'scrollHeight' ];
		const allSides = [].concat(sides, scrollSides);
		const sideByAxis = Object.fromEntries(
			axes.map((a, i) => [ a, sides[i] ])
		);
		const axesBySide = Object.fromEntries(
			sides.map((s, i) => [ s, axes[i] ])
		);
		const sideByScrollSide = Object.fromEntries(
			scrollSides.map((s, i) => [ s, sides[i] ])
		);

		function calc (element, cache, acc) {
			cache = cache || new Map();
			if (cache.has(element)) return cache.get(element);

			const { parent, children, styles } = element;
			const siblings = parent?.children;

			const autoAxes = axes.filter(a => styles[a] === 'auto');
			if (autoAxes.length) {
				if (acc) {
					for (const a of autoAxes) styles[a] = acc[a];
				}
				else {
					const stack = Object.fromEntries(autoAxes.map(a => [ a, 0 ]));

					for (const e of siblings || []) {
						if (e === element) break;

						const cs = calc(e, cache, stack);
						for (const a of autoAxes) {
							stack[a] = Math.max(stack[a], (cs[a] || 0) + (cs[sideByAxis[a]] || 0));
						}
					}

					Object.assign(styles, stack);
				}
			}

			const autoSides = allSides.filter(s => styles[s] === 'auto');
			if (autoSides.length) {
				const stack = Object.fromEntries(autoSides.map(s => [ s, 0 ]));
				if (Object.hasOwn(stack, 'width')) delete stack.scrollWidth;
				if (Object.hasOwn(stack, 'height')) delete stack.scrollHeight;

				for (const e of children) {
					const cs = calc(e, cache);
					for (const s of Object.keys(stack)) {
						const cside = sideByScrollSide[s] || s;
						stack[s] = Math.max(stack[s], (cs[axesBySide[cside]] || 0) + (cs[cside] || 0));
					}
				}

				Object.assign(styles, stack);
			}

			cache.set(element, styles);
			return styles;
		}

		it('enables automatic height', () => {
			const dom = new JSDOM(`
				<main>
					<article id="a1"></article>
					<article id="a2"></article>
				</main>
			`);
			const painter = new Painter().init(dom.window);

			const main = dom.window.document.querySelector('main');
			painter.paint(main, { height: 'auto' });
			painter.paint('article', { height: 100, y: 'auto' }, main);

			console.log('pre');
			assert.equal(main.offsetHeight, 200);

			const a3 = dom.window.document.createElement('article');
			a3.id = 'a3';
			main.appendChild(a3);

			console.log('post');
			assert.equal(main.offsetHeight, 300);
		});

		[
			[ 'width', 'x' ],
			[ 'height', 'y' ],
		].forEach(([ side, axis ]) => {
			it(`works with ${side} / ${axis}`, () => {
				const article = new Tag('article', { [side]: 'auto' }, [
					new Tag('img', { [side]: 100, [axis]: 'auto' }),
					new Tag('img', { [side]: 300, [axis]: 'auto' }),
					new Tag('img', { [side]: 200, [axis]: 'auto' }),
				]);
				const [ img1, img2, img3 ] = article.children;

				assert.deepEqual(calc(article), { [side]: 600 });
				assert.deepEqual(calc(img1), { [side]: 100, [axis]: 0 });
				assert.deepEqual(calc(img2), { [side]: 300, [axis]: 100 });
				assert.deepEqual(calc(img3), { [side]: 200, [axis]: 400 });
			});
		});

		[
			[ 'scrollWidth', 'width', 'x' ],
			[ 'scrollHeight', 'height', 'y' ],
		].forEach(([ scrollSide, side, axis ]) => {
			it(`works with ${scrollSide} / ${side}`, () => {
				const article = new Tag('article', { [side]: 400, [scrollSide]: 'auto' }, [
					new Tag('img', { [side]: 100, [axis]: 'auto' }),
					new Tag('img', { [side]: 300, [axis]: 'auto' }),
					new Tag('img', { [side]: 200, [axis]: 'auto' }),
				]);

				assert.deepEqual(calc(article), { [side]: 400, [scrollSide]: 600 });
			});
		});

		it('works mixed', () => {
			const window = new Tag('window', { height: 'auto' }, [
				new Tag('head', { height: 50 }),
				new Tag('article', { width: 'auto', height: 'auto', y: 'auto' }, [
					new Tag('img', { width: 100, height: 100, x: 'auto' }),
					new Tag('img', { width: 300, height: 400, x: 'auto' }),
					new Tag('img', { width: 200, height: 100, x: 'auto' }),
				]),
			]);
			const [ , article ] = window.children;
			const imgs = article.children;

			assert.deepEqual(calc(article), { width: 600, height: 400, y: 50 });
			assert.deepEqual(calc(imgs[1]), { width: 300, height: 400, x: 100 });
			assert.deepEqual(calc(imgs[2]), { width: 200, height: 100, x: 400 });
			assert.deepEqual(calc(window), { height: 450 });
		});
	});
});

describe('Painter/Layout', () => {
	const { Layout } = Painter;

	[
		[ 'scrollWidth', 'width' ],
		[ 'scrollHeight', 'height' ],
	].forEach(([ scrollSide, side ]) => {
		it(`.${scrollSide} is not less than .${side}`, () => {
			const layout = new Layout({ [scrollSide]: 90, [side]: 100 });
			assert.equal(layout[scrollSide], 100);
		});
	});

	[
		[ 'scrollX', 'scrollWidth', 'width' ],
		[ 'scrollY', 'scrollHeight', 'height' ],
	].forEach(([ scrollCoord, scrollSide, side ]) => {
		it(`.${scrollCoord} is not greater than .${scrollSide} - .${side}`, () => {
			const layout = new Layout({ [scrollCoord]: 60, [scrollSide]: 150, [side]: 100 });
			assert.equal(layout[scrollCoord], 50);
		});
	});

	[
		'left',
		'top',
		'right',
		'bottom',
	].forEach(prop => {
		it(`.${prop} is not set from styles`, () => {
			const layout = new Layout({ [prop]: 1 });
			assert.equal(layout[prop], 0);
		});
	});

	[
		[ 'left', 'x', 'width' ],
		[ 'top', 'y', 'height' ],
	].forEach(([ alias, coord, side ]) => {
		it(`.${alias} matches .${coord}`, () => {
			const layout = new Layout({ [coord]: 10 });
			assert.equal(layout[alias], 10);
		});

		it(`.${alias} is product of .${coord} + .${side}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: -100 });
			assert.equal(layout[alias], -90);
		});
	});

	[
		[ 'right', 'x', 'width' ],
		[ 'bottom', 'y', 'height' ],
	].forEach(([ prop, coord, side ]) => {
		it(`.${prop} matches .${coord} + .${side}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: 100 });
			assert.equal(layout[prop], 110);
		});

		it(`.${prop} is not less than .${coord}`, () => {
			const layout = new Layout({ [coord]: 10, [side]: -100 });
			assert.equal(layout[prop], 10);
		});
	});
});
