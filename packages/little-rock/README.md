# Little Rock

A painter module for emulating basic layout. Useful for testing code dealing with dimensions, positions, scrolling etc.

## Table of Contents

- [Basic usage](#basic-usage)
- [Web APIs](#web-api-implementation)
- [API](#api)
  - [Painter](#painter)
    - [new Painter(options)](#new-painteroptions)
    - [painter.init(window)](#painterinitwindow)
    - [painter.beforeParse(window)](#painterbeforeparsewindow)
    - [painter.paint(target, styleChanges, parent)](#painterpainttarget-stylechanges-parent)
  - [Stylesheet](#stylesheet)
  	- [new Stylesheet(ruleSet)](#new-stylesheetruleset)
  	- [stylesheet.add(ruleSet)](#stylesheetaddruleset)

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

## Web APIs

Adds the following web APIs to DOM interfaces

- `Window`
	- Properties:
		- `innerWidth`
		- `innerHeight`
		- `scrollX`
		- `scrollY`
		- `pageXOffset`
		- `pageYOffset`
	- Methods:
		- `scroll()`
		- `scrollTo()`
		- `scrollBy()`
- `Element`
	- Properties:
		- `scrollWidth`
		- `scrollHeight`
		- `scrollLeft`
		- `scrollTop`
	- Methods:
		- `getBoundingClientRect()`
		- `scroll()`
		- `scrollTo()`
		- `scrollBy()`
- `HTMLElement`
	- Properties:
		- `offsetWidth`
		- `offsetHeight`
		- `offsetLeft`
		- `offsetTop`

## API

### `Painter`

A painter module to manage, calculate and provide web APIs for layout

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
import { Painter, Stylesheet } from '@zombieland/little-rock';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div>HTMLElement</div>');

it('create a painter', () => {
  const painter = new Painter();
  painter.init(dom.window);
});

it('creates painter with options.window', () => {
  const painter = new Painter(dom);
});

it('creates painter with options.stylesheet', () => {
  const stylesheet = new Stylesheet({
    'div': { width: 100, height: 50 },
  });
  const painter = new Painter({ stylesheet });
  new JSDOM(`<div>HTMLElement</div>`, {
    runScripts: 'dangerously',
  	beforeParse(window) {
      painter.beforeParse(window);
  	}
  })
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

- `target` `<Element>` | `<string>` DOM element or CSS selector
- `styleChanges` `<Object>` Style properties to apply. Used to calculate layout
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

#### `painter.getLayout(element[, _relative, _cache, _accumulated])`

Used internally to calculate `element` layout from element and stylesheet styles. Called each time layout is requested by a web interface, such as `Element.getBoundingClientRect()`

- `element` `<Element>` DOM element to get layout for


### `Stylesheet`

A stylesheet module to hold styles by selector.

```js
import { Stylesheet } from '@zombieland/little-rock';
```

#### `new Stylesheet([ruleSet])`

Creates a new Stylesheet instance and adds supplied rule sets to sheet

- `ruleSet` `<Object>` Rule set passed on to `stylesheet.add()`
- Returns: `<Stylesheet>`

```js
const stylesheet = new Stylesheet({
	'*': { width: 400 },
  'div': { height: 200 },
  '.class': { y: 50 },
  '#id': { scrollHeight: 400 },
});
```

#### `stylesheet.add(ruleSet)`

Adds set of rules to sheet. Used by `painter.paint()` when painting a selector.

- `ruleSet` `<Object>` A set of rules with selectors for keys and layout properties for values. See `painter.paint()`

```js
stylesheet.add({
	'*': { width: 400 },
  'div': { height: 200 },
  '.class': { y: 50 },
  '#id': { scrollHeight: 400 },
});
```

#### `stylesheet.getMatchingStyles(element)`

Gets styles from stylesheet matching `element`. Used by `painter` when calculating layout.

- `element` `<Element>` Element to get matching styles for. Uses `element.matches()` for selector matching.
- Returns: `<Array>` List of style objects sorted ascending by selector specificity. Uses [specificity](https://www.npmjs.com/package/specificity) for sorting.

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
