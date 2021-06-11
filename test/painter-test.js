"use strict";

const Painter = require("../lib/painter.js");
const {JSDOM} = require("jsdom");
const {strict: assert} = require("assert");

describe("painter", () => {
  let dom, element;
  beforeEach("load DOM", () => {
    dom = new JSDOM("<div>HTMLElement</div>");
    element = dom.window.document.querySelector("div");
    assert(element, "expected element");
  });

  let paint;
  beforeEach("initialize painter", () => {
    const painter = Painter();
    paint = painter.init(dom.window);
  });

  describe("dimensions", () => {
    beforeEach(() => {
      paint(element, {
        x: 50,
        y: 20,
        width: 150,
        height: 250,
      });
    });

    describe("Element", () => {
      beforeEach("is instance of Element", () => {
        assert.equal(element instanceof dom.window.Element, true, "expected instance of Element");
      });

      it(".getBoundingClientRect()", () => {
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
      });
    });

    describe("HTMLElement", () => {
      beforeEach("is instance of HTMLElement", () => {
        assert.equal(element instanceof dom.window.HTMLElement, true, "expected instance of HTMLElement");
      });

      it(".offsetLeft", () => {
        assert.equal(element.offsetLeft, 50);
      });

      it(".offsetTop", () => {
        assert.equal(element.offsetTop, 20);
      });

      it(".offsetWidth", () => {
        assert.equal(element.offsetWidth, 150);
      });

      it(".offsetHeight", () => {
        assert.equal(element.offsetHeight, 250);
      });
    });
  });

  describe("change dimensions", () => {
    it("bounding box can be changed by paint", () => {

    });
  });

  describe("stylesheet", () => {
    it("defaults bounding box values to 0", async () => {
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

    it("can change default bounding box", async () => {
      const dom = new JSDOM(`<div>HTMLElement</div>`);
      const element = dom.window.document.querySelector("div");
      assert(element, "expected element");
      const customPainter = Painter({
        stylesheet: {
          "*": {
            x: 50,
            y: 20,
            width: 150,
            height: 250,
          }
        }
      });
      customPainter.init(dom.window);
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
    });

    it("compounds multiple matching styles", async () => {
      const dom = new JSDOM(`
        <h1>A heading</h1>
        <p>A paragraph…</p>
      `);
      const customPainter = Painter({
        stylesheet: {
          "*": {
            width: 375,
          },
          "h1": {
            height: 36,
          },
          "p": {
            height: 160,
            y: 36,
          }
        }
      });
      customPainter.init(dom.window);

      const [h1, p] = dom.window.document.body.children;
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
  });
});
