# Little Rock

A layout module for emulating anything visual.

JSDOM does not provide a way to emulate layout out of the box. When major part of an application's client side JS consists of lazy loading / sticky behaviour etc. this is required.


## Todo

- [ ] Means to emulate fixed / sticky / hidden layout.
- [ ] Further implement web APIs such as setters for `Element.scrollLeft` / `.scrollTop`
- [ ] Cache for layout calculation. Clear on paints and DOM updates. Mutation observer would work it it were synchronous.
- [x] Paint method behaves different when used on an element and a selector. Maybe it should. Styles applied to element will overwrite previous styles. Styles applied to selector will be appended to stylesheet.
- [x] Scrolling behavior is **very** bare bones.
- [x] Painting with both "stylesheets" and "elements" might not cause expected behavior. When scrolling an initial paint will read from all style sources: first stylesheet then element. Then compiled diff will be applied to element giving it the "importance" of inline styles.
- [x] Convert to classes like JSDOM and the rest of the modules.
- [x] Further implement web APIs such as `Element.scrollWidth` / `.scrollHeight`
- [x] Limitations on scroll coordinates.
- [x] Automatic dimensions / coordinates. Maybe just paint method could take a list of elements with like `{ y: 'auto' }` and it could stack them along the supplied axis, optionally updating supplied parent. Would be nice if it could work with dynamically injected elements / stylesheets as well.
- [x] Cleanup parent / child management - implicit relations to `Window` etc.
