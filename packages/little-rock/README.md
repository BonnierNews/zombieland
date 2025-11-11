# Little Rock

A layout module for emulating anything visual.

JSDOM does not provide a way to emulate layout out of the box. When major part of an application's client side JS consists of lazy loading / sticky behaviour etc. this is required.

## Table of Contents

- [Basic usage](#basic-usage)
- [API](#api)
  - [Painter](#painter)
    - [new Painter(options)](#new-painteroptions)
    - [painter.init(window)](#painterinitwindow)
    - [painter.paint(target, styleChanges, parent)](#painterpainttarget-stylechanges-parent)
    - [painter.getLayout(source, relative, cache, accumulated)](#paintergetlayoutsource-relative-cache-accumulated)
    - [painter.beforeParse](#painterbeforeparse)
- [Web API Implementation](#web-api-implementation)
  - [Element Properties](#element-properties)
  - [HTMLElement Properties](#htmlelement-properties)
  - [Window Properties](#window-properties)
  - [Scroll Methods](#scroll-methods)
- [Layout Features](#layout-features)
  - [Stylesheet Integration](#stylesheet-integration)
  - [Automatic Layout](#automatic-layout)
  - [Hierarchical Scrolling](#hierarchical-scrolling)
- [Todo](#todo)

## Basic usage

```js
import assert from 'node:assert/strict';
import { Painter } from '@zombieland/little-rock';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div>Content</div>');
const element = dom.window.document.querySelector('div');

const painter = new Painter(dom);
painter.paint(element, {
  width: 150,
  height: 250,
  x: 50,
  y: 20,
  scrollWidth: 450,
  scrollHeight: 300
});

assert.equal(element.offsetWidth, 150);
assert.equal(element.offsetHeight, 250);
assert.deepEqual(element.getBoundingClientRect(), {
  width: 150,
  height: 250,
  x: 50,
  y: 20,
  left: 50,
  right: 200,
  top: 20,
  bottom: 270
});
```

## API

### `Painter`

A class that provides comprehensive layout emulation for JSDOM environments.

```js
import { Painter } from '@zombieland/little-rock';
```

#### `new Painter([options])`

Creates a new Painter instance for layout emulation.

- `options` `<Object>` Painter options
  - `window` `<Window>` Window instance to pass on to `painter.init()`
  - `stylesheet` `<Stylesheet>` Little Rock Stylesheet instance. **Default:** `new Stylesheet()`
- Returns: `<Painter>`

```js

const dom = new JSDOM('<div>HTMLElement</div>');

it('create a painter', () => {
  const painter = new Painter();
  painter.init(dom.window);
});

it('creates painter with options.window', () => {
  const painter = new Painter(dom);
});

it('creates painter with options.stylesheet', () => {
	const { Stylesheet } = await import('@zombieland/little-rock');
  const stylesheet = new Stylesheet({
    'div': { width: 100, height: 50 },
  });
  const painter = new Painter({
	  window: dom.window,
	  stylesheet
  });
});
```

#### `painter.init(window)`

Adds layout interfaces to `window` and element prototypes

- `window` `<Window>` A window instance
- Returns: `<Painter>` The painter instance for chaining.

#### `painter.beforeParse(window)`

Alias of `painter.init`. Used by the Tallahassee Browser module. See notes on `browser.load()`.

#### `painter.paint(target, styleChanges[, parent])`

Applies layout styles to elements or selectors.

- `target` `<string>` | `<Element>` CSS selector or DOM element
- `styleChanges` `<Object>` Layout properties to apply
	- `width`, `height` `<number>` | `<string>` Element dimensions in number of pixels or `'auto'`
	- `x`, `y` `<number>` | `<string>` Element position in number of pixels or `'auto'`
	- `scrollWidth`, `scrollHeight` `<number>` | `<string>` Scrollable content dimensions in number of pixels or `'auto'`
	- `scrollX`, `scrollY` `<number>` | `<string>` Scroll position in number of pixels or `'auto'`
- `parent` `<Element>` | `<Window>` Parent element. **Default:** `window` passed in `browser.init()`
- Returns: `<Painter>` The painter instance for chaining


```js
it('paints element node', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const element = dom.window.document.querySelector('div');

  const painter = new Painter(dom);
  painter.paint(element, { height: 200, y: 100 });

  assert.equal(element.offsetHeight, 200);
  assert.equal(element.offsetTop, 100);
});

it('paints elements by selector', () => {
  const dom = new JSDOM('');

  const painter = new Painter(dom);
  painter.paint('div', { width: 200, height: 200 });

  const element = dom.window.document.createElement('div');
  dom.window.document.body.append(element);
  painter.paint(element, { height: 400, y: 100 });

  assert.equal(element.offsetWidth, 200);
  assert.equal(element.offsetHeight, 400);
  assert.equal(element.offsetTop, 100);
});

it('styles painted with element supersede styles painted with selector', () => {
  const dom = new JSDOM('');

  const painter = new Painter(dom);
  painter.paint('div', { width: 200, height: 200 });

  const element1 = dom.window.document.createElement('div');
  const element2 = dom.window.document.createElement('div');
  dom.window.document.body.append(element1, element2);
  painter.paint(element2, { height: 400 });

  assert.equal(element1.offsetWidth, 200);
  assert.equal(element1.offsetHeight, 200);

  assert.equal(element2.offsetWidth, 200);
  assert.equal(element2.offsetHeight, 400);
});
```

##### Nested layouts

All positions in `styleChanges` are relative to a parent. By default this is `window` but it can be nested further by passing an `Element` in the `parent` argument.

```js
it('paints nested element', () => {
	const dom = new JSDOM('<ul><li>HTMLElement</li></ul>');
	const list = dom.window.document.querySelector('ul');
	const listItem = list.querySelector('li');

	const painter = new Painter(dom);
  painter.paint(list, { y: 100 });
  painter.paint(listItem, { y: 20 }, list);

  assert.equal(list.offsetTop, 100);
  assert.equal(listItem.offsetTop, 120);
});
```

Relational layouts are purely based on the parent structure expressed with `painter.paint()` and the `parent` argument.

```js
it('can not base layout on the document', () => {
	const dom = new JSDOM('<ul><li>HTMLElement</li></ul>');
	const list = dom.window.document.querySelector('ul');
	const listItem = list.querySelector('li');

	const painter = new Painter(dom);
  painter.paint(list, { y: 100 });
  painter.paint(listItem, { y: 20 }); // no parent

  assert.equal(list.offsetTop, 100);
  assert.fail(() => {
  	assert.equal(listItem.offsetTop, 120);
  });
});
```

##### Automatic layouts

It is possible to create automatic layouts using the `'auto'` value.

This is useful when application scripts change the document dynamically and manual painting of content is not possible before script reads layout.

> This does not attempt to replicate how browsers paint elements with CSS `'auto'`. It crudely enables layouts to be updated by dynamically added content.

```js
it('automatically positions elements in stacks', () => {
  const dom = new JSDOM('<ul><li /></ul>');
  const list = dom.window.document.querySelector('ul');
  const items = list.getElementsByTagName('li');

  const painter = new Painter(dom);
  painter.paint('li', { height: 50, y: 'auto' }, list);

  assert.equal(items.length, 1);
  assert.equal(items[0].offsetTop, 0);

  list.insertAdjacentHTML('beforeend', '<li />');

  assert.equal(items.length, 2);
  assert.equal(items[1].offsetTop, 50);
});

it('automatically sizes element to fit content', () => {
  const dom = new JSDOM('<ul><li /></ul>');
  const list = dom.window.document.querySelector('ul');
  const items = list.getElementsByTagName('li');

  const painter = new Painter(dom);
  painter.paint(list, { width: 'auto' });
  painter.paint('li', { width: 50, x: 'auto' }, list);

  assert.equal(items.length, 1);
  assert.equal(list.offsetWidth, 50);

  list.insertAdjacentHTML('beforeend', '<li />');

  assert.equal(items.length, 2);
  assert.equal(list.offsetWidth, 100);
});
```

## Web API Implementation

The Painter class implements missing Web APIs in JSDOM environments:

### Element Properties

- `scrollWidth`, `scrollHeight` - Content dimensions including overflow
- `scrollLeft`, `scrollTop` - Current scroll position

```js
it('implements scroll properties', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const element = dom.window.document.querySelector('div');

  const painter = new Painter(dom);
  painter.paint(element, {
    scrollWidth: 450,
    scrollHeight: 300,
    scrollX: 20,
    scrollY: 10
  });

  assert.equal(element.scrollWidth, 450);
  assert.equal(element.scrollHeight, 300);
  assert.equal(element.scrollLeft, 20);
  assert.equal(element.scrollTop, 10);
});
```

### HTMLElement Properties

- `offsetWidth`, `offsetHeight` - Element dimensions
- `offsetLeft`, `offsetTop` - Position relative to offset parent

```js
it('implements offset properties', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);
  const element = dom.window.document.querySelector('div');

  painter.paint(element, { width: 150, height: 250, x: 50, y: 20 });

  assert.equal(element.offsetWidth, 150);
  assert.equal(element.offsetHeight, 250);
  assert.equal(element.offsetLeft, 50);
  assert.equal(element.offsetTop, 20);
});
```

### Window Properties

- `innerWidth`, `innerHeight` - Viewport dimensions
- `scrollX`, `scrollY`, `pageXOffset`, `pageYOffset` - Scroll positions

```js
it('implements window viewport and scroll properties', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);

  painter.paint(dom.window, { width: 900, height: 1600, scrollX: 20, scrollY: 10 });

  assert.equal(dom.window.innerWidth, 900);
  assert.equal(dom.window.innerHeight, 1600);
  assert.equal(dom.window.scrollX, 20);
  assert.equal(dom.window.pageXOffset, 20); // alias
  assert.equal(dom.window.scrollY, 10);
  assert.equal(dom.window.pageYOffset, 10); // alias
});
```

### Scroll Methods

Implements scroll methods that dispatch `scroll` events:

- `scroll(x, y)` / `scroll({ left, top })` - Scroll to absolute position
- `scrollTo(x, y)` / `scrollTo({ left, top })` - Alias for scroll
- `scrollBy(x, y)` / `scrollBy({ left, top })` - Scroll by relative amount
- `scrollIntoView()` - Scroll element into view (elements only)

```js
it('implements scroll methods with coordinate syntax', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);
  const element = dom.window.document.querySelector('div');

  painter.paint(element, { scrollX: 20, scrollY: 10 });
  element.scrollTo(30, 50);

  assert.equal(element.scrollLeft, 30);
  assert.equal(element.scrollTop, 50);
});

it('implements scroll methods with options syntax', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);
  const element = dom.window.document.querySelector('div');

  element.scroll({ left: 40, top: 60 });
  assert.equal(element.scrollLeft, 40);
  assert.equal(element.scrollTop, 60);
});

it('implements relative scrolling with scrollBy', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);
  const element = dom.window.document.querySelector('div');

  painter.paint(element, { scrollX: 40, scrollY: 60 });
  element.scrollBy(10, 10);

  assert.equal(element.scrollLeft, 50); // 40 + 10
  assert.equal(element.scrollTop, 70);  // 60 + 10
});

it('dispatches scroll events', async () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);
  const element = dom.window.document.querySelector('div');

  const pendingScroll = new Promise(resolve =>
    element.addEventListener('scroll', resolve, { once: true })
  );

  element.scrollTo(30, 50);
  await pendingScroll; // Event was dispatched
});

it('implements scroll methods on window', () => {
  const dom = new JSDOM('<div>HTMLElement</div>');
  const painter = new Painter(dom);

  dom.window.scrollTo(100, 200);
  assert.equal(dom.window.scrollX, 100);
  assert.equal(dom.window.scrollY, 200);
});
```

## Layout Features

### Stylesheet Integration

Use stylesheets for CSS-like rules with selector specificity:

```js
it('uses selector specificity to resolve conflicting styles', () => {
  import { Stylesheet } from '@zombieland/little-rock';

  const dom = new JSDOM('<h1 id="the-heading" class="heading">A heading</h1>');
  const stylesheet = new Stylesheet({
    '*': { width: 375 },           // Universal selector
    'h1': { height: 36 },          // Element selector
    '.heading': { height: 20 },    // Class selector
    '#the-heading': { height: 30 } // ID selector (highest specificity)
  });

  const painter = new Painter({ stylesheet, dom });
  const h1 = dom.window.document.querySelector('h1');

  assert.equal(h1.offsetWidth, 375); // From * selector
  assert.equal(h1.offsetHeight, 30); // From #the-heading (highest specificity)
});

it('element styles override stylesheet styles', () => {
  import { Stylesheet } from '@zombieland/little-rock';

  const dom = new JSDOM('<h1>A heading</h1>');
  const stylesheet = new Stylesheet({
    'h1': { height: 36 }
  });

  const painter = new Painter({ stylesheet, dom });
  const h1 = dom.window.document.querySelector('h1');

  painter.paint(h1, { height: 40 });
  assert.equal(h1.offsetHeight, 40); // Element style takes precedence
});
```

### Automatic Layout

Automatic layout with `'auto'` values for responsive behavior:

```js
it('stacks elements vertically with auto positioning', () => {
  const dom = new JSDOM('<article><img><img><img></article>');
  const painter = new Painter(dom);
  const article = dom.window.document.querySelector('article');
  const [img1, img2, img3] = article.children;

  painter.paint('img', { height: 100, y: 'auto' }, article);

  assert.equal(img1.offsetTop, 0);   // First at y: 0
  assert.equal(img2.offsetTop, 100); // Second at y: 100
  assert.equal(img3.offsetTop, 200); // Third at y: 200
});

it('sizes container to fit content automatically', () => {
  const dom = new JSDOM('<article><img><img><img></article>');
  const painter = new Painter(dom);
  const article = dom.window.document.querySelector('article');

  painter.paint('img', { height: 100, y: 'auto' }, article);
  painter.paint(article, { height: 'auto' });

  assert.equal(article.offsetHeight, 300); // 3 × 100px images
});

it('works with dynamic content', () => {
  const dom = new JSDOM('<article><img><img><img></article>');
  const painter = new Painter(dom);
  const article = dom.window.document.querySelector('article');
  const [img1, img2, img3] = article.children;

  painter.paint('img', { height: 100, y: 'auto' }, article);
  painter.paint(article, { height: 'auto' });

  const newImg = dom.window.document.createElement('img');
  article.appendChild(newImg);

  assert.equal(article.offsetHeight, 400); // Now 4 × 100px images
  assert.equal(newImg.offsetTop, 300);     // Fourth at y: 300

  img1.remove();
  assert.equal(article.offsetHeight, 300); // Back to 3 × 100px
  assert.equal(img3.offsetTop, 200);       // Third now at y: 200
});
```

### Hierarchical Scrolling

Supports nested scrolling with proper coordinate calculation:

```js
it('scrolling window affects all descendants', () => {
  const dom = new JSDOM(`
    <article>
      <div>
        <img>
        <img>
      </div>
    </article>
  `);
  const painter = new Painter(dom);
  const ancestor = dom.window.document.querySelector('article');
  const parent = ancestor.firstElementChild;
  const [child1, child2] = parent.children;

  painter.paint(ancestor, { width: 400, y: 50 });
  painter.paint(parent, { width: 400, y: 70 }, ancestor);
  painter.paint(child1, { x: 0, width: 400, y: 70 }, parent);
  painter.paint(child2, { x: 400, width: 400, y: 70 }, parent);

  dom.window.scrollTo(0, 50);

  assert.deepEqual(
    pick(ancestor.getBoundingClientRect(), 'x', 'y'),
    { x: 0, y: 0 }  // 50 - 50 (window scroll)
  );
  assert.deepEqual(
    pick(child1.getBoundingClientRect(), 'x', 'y'),
    { x: 0, y: 20 }  // 70 - 50 (window scroll)
  );
});

it('multiple scroll levels compound', () => {
  const dom = new JSDOM(`
    <article>
      <div>
        <img>
        <img>
      </div>
    </article>
  `);
  const painter = new Painter(dom);
  const ancestor = dom.window.document.querySelector('article');
  const parent = ancestor.firstElementChild;
  const [child1, child2] = parent.children;

  painter.paint(ancestor, { width: 400, y: 50 });
  painter.paint(parent, { width: 400, y: 70 }, ancestor);
  painter.paint(child1, { x: 0, width: 400, y: 70 }, parent);
  painter.paint(child2, { x: 400, width: 400, y: 70 }, parent);

  ancestor.scrollTo(0, 50);
  parent.scrollTo(400, 0);

  assert.deepEqual(
    pick(child1.getBoundingClientRect(), 'x', 'y'),
    { x: -400, y: 20 } // Affected by parent scroll
  );
  assert.deepEqual(
    pick(child2.getBoundingClientRect(), 'x', 'y'),
    { x: 0, y: 20 }    // 400 - 400 (parent scroll)
  );
});
```

## Todo

- [ ] Means to emulate fixed / sticky / hidden layout.
- [ ] Cache for layout calculation. Clear on paints and DOM updates. Mutation observer would work it it were synchronous.
- [x] Paint method behaves different when used on an element and a selector. Maybe it should. Styles applied to element will overwrite previous styles. Styles applied to selector will be appended to stylesheet.
- [x] Scrolling behavior is **very** bare bones.
- [x] Painting with both "stylesheets" and "elements" might not cause expected behavior. When scrolling an initial paint will read from all style sources: first stylesheet then element. Then compiled diff will be applied to element giving it the "importance" of inline styles.
- [x] Convert to classes like JSDOM and the rest of the modules.
- [x] Further implement web APIs such as `Element.scrollWidth` / `.scrollHeight`
- [x] Limitations on scroll coordinates.
- [x] Automatic dimensions / coordinates. Maybe just paint method could take a list of elements with like `{ y: 'auto' }` and it could stack them along the supplied axis, optionally updating supplied parent. Would be nice if it could work with dynamically injected elements / stylesheets as well.
- [x] Cleanup parent / child management - implicit relations to `Window` etc.
