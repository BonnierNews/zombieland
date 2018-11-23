"use strict";

const app = require("../app/app");
const Browser = require("../");
const nock = require("nock");
const Path = require("path");
const {Compiler} = require("../lib/Compiler");

describe("Tallahassee", () => {
  before(() => {
    Compiler([/assets\/scripts/]);
  });

  describe("navigateTo()", () => {
    it("navigates to url", async () => {
      await Browser(app).navigateTo("/");
    });

    it("returns browser window", async () => {
      const browser = await Browser(app).navigateTo("/");
      expect(browser.window).to.be.ok;
    });

    it("sets browser window location", async () => {
      const browser = await Browser(app).navigateTo("/", {
        Host: "www.expressen.se"
      });
      expect(browser.window).to.be.ok;
      expect(browser.window.location.host).to.equal("www.expressen.se");
    });

    it("exposes http response", async () => {
      const browser = await Browser(app).navigateTo("/");
      expect(browser.response).to.be.ok;
      expect(browser.response).to.have.property("statusCode", 200);
      expect(browser.response).to.have.property("headers").that.deep.include({
        "content-type": "text/html; charset=UTF-8"
      });
    });

    it("throws if not 200", async () => {
      try {
        await Browser(app).navigateTo("/404");
      } catch (e) {
        var err = e; // eslint-disable-line no-var
      }
      expect(err).to.be.ok;
    });

    it("passes along cookies", async () => {
      const browser = await Browser(app).navigateTo("/reply-with-cookies", { cookie: "myCookie=singoalla;mySecondCookie=chocolateChip" });
      expect(browser.$("body").text()).to.equal("myCookie=singoalla;mySecondCookie=chocolateChip");
    });

    it("returns browser with navigateTo capability that returns new browser with preserved cookie", async () => {
      const browser = await Browser(app).navigateTo("/", { cookie: "myCookie=singoalla;mySecondCookie=chocolateChip" });

      const newBrowser = await browser.navigateTo("/reply-with-cookies");

      expect(newBrowser.$("body").text()).to.equal("myCookie=singoalla;mySecondCookie=chocolateChip");
    });

    it("follows redirects", async () => {
      const browser = await Browser(app).navigateTo("/redirect");
      expect(browser.response).to.be.ok;
      expect(browser.response).to.have.property("statusCode", 200);
      expect(browser.window.location.path).to.equal("/req-info-html");
    });

    it("keeps original request headers when it follows local redirects", async () => {
      const browser = await Browser(app).navigateTo("/redirect", {
        host: "www.expressen.se",
        "x-forwarded-proto": "https"
      });
      expect(browser.response).to.be.ok;
      const reqInfo = JSON.parse(browser.$("body").text());
      expect(reqInfo.reqHeaders).to.have.property("host", "www.expressen.se");
      expect(reqInfo.reqHeaders).to.have.property("x-forwarded-proto", "https");
    });

    it("only sends specified headers when following local redirects", async () => {
      nock("https://www.example.com")
        .get("/")
        .reply(302, "", {
          location: "https://www.expressen.se/req-info-html"
        });
      const browser = await Browser(app).navigateTo("/external-redirect", {
        host: "www.expressen.se",
        "x-forwarded-proto": "https"
      });
      expect(browser.response).to.be.ok;
      const reqInfo = JSON.parse(browser.$("body").text());
      expect(reqInfo.reqHeaders).to.have.property("host", "www.expressen.se");
      expect(reqInfo.reqHeaders).to.have.property("x-forwarded-proto", "https");
    });

    it("handles redirect loops by throwing", (done) => {
      Browser(app).navigateTo("/redirect-loop")
        .catch(() => {
          done();
        });
    });
  });

  describe("runScripts()", () => {
    let browser;

    beforeEach(async () => {
      browser = await Browser(app).navigateTo("/");
    });

    it("runs all scripts without context", () => {
      expect(browser.document.documentElement.classList.contains("no-js")).to.be.true;
      expect(browser.window).to.not.have.property("scriptsAreExecutedInBody");

      browser.runScripts();

      expect(browser.document.documentElement.classList.contains("no-js")).to.be.false;
      expect(browser.window).to.have.property("scriptsAreExecutedInBody", true);
    });

    it("runs scripts within supplied context", () => {
      expect(browser.document.documentElement.classList.contains("no-js")).to.be.true;
      expect(browser.window).to.not.have.property("scriptsAreExecutedInBody");

      browser.runScripts(browser.document.head);

      expect(browser.document.documentElement.classList.contains("no-js")).to.be.false;
      expect(browser.window).to.not.have.property("scriptsAreExecutedInBody");
    });
  });

  describe("document", () => {
    it("doesn't expose classList on document", async () => {
      const browser = await Browser(app).navigateTo("/");
      expect(browser.document.classList, "classList on document").to.be.undefined;
    });

    it("sets cookie on document", async () => {
      const browser = await Browser(app).navigateTo("/", {
        cookie: "_ga=12"
      });

      expect(browser.document).to.have.property("cookie", "_ga=12");
    });

    it("sets cookie on document disregarding casing", async () => {
      const browser = await Browser(app).navigateTo("/", {
        CookIe: "_ga=13"
      });

      expect(browser.document).to.have.property("cookie", "_ga=13");
    });

    it("sets multiple cookies on document", async () => {
      const browser = await Browser(app).navigateTo("/", {
        cookie: "cookie1=abc;cookie2=def"
      });

      expect(browser.document).to.have.property("cookie", "cookie1=abc;cookie2=def");
    });

    it("sets multiple cookies on document disregarding whitespace and empty values", async () => {
      const browser = await Browser(app).navigateTo("/", {
        cookie: " cookie1=abc; cookie2=def; ;   ;\tcookie3=ghi;; ;   ;"
      });

      expect(browser.document).to.have.property("cookie", "cookie1=abc;cookie2=def;cookie3=ghi");
    });
  });

  describe("window", () => {
    it("exposes a document property", async () => {
      const browser = await Browser(app).navigateTo("/");

      expect(browser.window.document === browser.document).to.be.true;
    });
  });

  describe("run script", () => {
    it("transpiles and runs es6 script", async () => {
      const browser = await Browser(app).navigateTo("/", {
        Cookie: "_ga=1"
      });

      require("../app/assets/scripts/main");

      expect(browser.document.cookie).to.equal("_ga=1");
      expect(browser.document.getElementsByClassName("set-by-js")).to.have.length(1);
    });

    it("again", async () => {
      const browser = await Browser(app).navigateTo("/");

      require("../app/assets/scripts/main");

      expect(browser.document.cookie).to.equal("");
      expect(browser.document.getElementsByClassName("set-by-js")).to.have.length(0);
    });
  });

  describe("submit", () => {
    it("submits get form on click", async () => {
      const browser = await Browser(app).navigateTo("/", {cookie: "_ga=2"});

      const form = browser.document.getElementById("get-form");
      const [input] = form.getElementsByTagName("input");
      const [button] = form.getElementsByTagName("button");

      input.name = "q";
      input.value = "12";

      button.click();

      expect(browser._pending).to.be.ok;

      const newNavigation = await browser._pending;

      expect(newNavigation.document.cookie).to.equal("_ga=2");
      expect(newNavigation.window.location).to.have.property("search", "?q=12");
    });

    it("submits post form on click", async () => {
      const browser = await Browser(app).navigateTo("/", {cookie: "_ga=2"});

      const form = browser.document.getElementById("post-form");
      const [button] = form.getElementsByTagName("button");

      button.click();

      expect(browser._pending).to.be.ok;

      const newBrowser = await browser._pending;

      expect(newBrowser.document.body.innerHTML).to.contain("Post body");
    });

    it("submits post form with payload on click", async () => {
      const browser = await Browser(app).navigateTo("/");

      const form = browser.document.getElementById("post-form");
      const [input] = form.getElementsByTagName("input");
      const [button] = form.getElementsByTagName("button");

      input.name = "q";
      input.value = "12";

      button.click();

      expect(browser._pending).to.be.ok;

      const newBrowser = await browser._pending;

      expect(newBrowser.document.body.innerHTML).to.contain("{\"q\":\"12\"}");
    });

    it("submits post form without action to the same route on click", async () => {
      const browser = await Browser(app).navigateTo("/?a=b");

      const form = browser.document.getElementById("post-form-without-action");
      const [input] = form.getElementsByTagName("input");
      const [button] = form.getElementsByTagName("button");

      input.name = "q";
      input.value = "12";

      button.click();

      expect(browser._pending).to.be.ok;

      const newBrowser = await browser._pending;

      expect(newBrowser.document.body.innerHTML).to.contain("{\"q\":\"12\"}");
      expect(newBrowser.window.location).to.have.property("search", "?a=b");
    });

    it("follows redirect on get", async () => {
      const browser = await Browser(app).navigateTo("/");

      const form = browser.document.getElementById("get-form-redirect");
      const [button] = form.getElementsByTagName("button");

      button.click();

      expect(browser._pending).to.be.ok;

      const newBrowser = await browser._pending;

      expect(newBrowser.window.location.path).to.equal("/req-info-html");
    });

    it("follows redirect on post", async () => {
      const browser = await Browser(app).navigateTo("/");

      const form = browser.document.getElementById("post-form-redirect");
      const [button] = form.getElementsByTagName("button");

      button.click();

      expect(browser._pending).to.be.ok;

      const newBrowser = await browser._pending;

      expect(newBrowser.window.location.path).to.equal("/req-info-html");
    });
  });

  describe("focusIframe()", () => {
    it("iframe from same host scopes window and document and sets frameElement and inherits cookie", async () => {
      const browser = await Browser(app).navigateTo("/", {cookie: "_ga=2"});

      const element = browser.document.createElement("iframe");
      element.id = "friendly-frame";
      element.src = "/friendly/";
      browser.document.body.appendChild(element);

      const iframe = browser.document.getElementById("friendly-frame");
      const iframeScope = await browser.focusIframe(iframe);

      expect(iframeScope.window === browser.window, "scoped window").to.be.false;
      expect(iframeScope.window.top === browser.window, "window.top").to.be.true;
      expect(iframeScope.document === browser.document, "scoped document").to.be.false;
      expect(iframeScope.document.cookie, "scoped document cookie").to.equal("_ga=2");
      expect(iframeScope.window.frameElement === iframe, "window.frameElement property").to.be.true;
    });

    it("iframe from other host scopes window and document", async () => {
      nock("http://example.com")
        .get("/framed-content")
        .replyWithFile(200, Path.join(__dirname, "../app/assets/public/index.html"), {
          "Content-Type": "text/html"
        });

      const browser = await Browser(app).navigateTo("/", {cookie: "_ga=2"});

      const element = browser.document.createElement("iframe");
      element.id = "iframe";
      element.src = "//example.com/framed-content";
      browser.document.body.appendChild(element);

      const iframe = browser.document.getElementById("iframe");
      const iframeScope = await browser.focusIframe(iframe);

      expect(iframeScope.window === browser.window, "scoped window").to.be.false;
      expect(iframeScope.window.top, "window.top").to.be.ok;

      expect(() => iframeScope.window.top.location.pathname).to.throw("Blocked a frame with origin \"http://example.com\" from accessing a cross-origin frame.");

      expect(iframeScope.document === browser.document, "scoped document").to.be.false;
      expect(iframeScope.document.cookie, "scoped document cookie").to.equal("");
      expect(iframeScope.window.frameElement, "window.frameElement property").to.be.undefined;
    });
  });

  describe("non 200 response", () => {
    it("can override expected status code", async () => {
      const browser = await Browser(app).navigateTo("/404", null, 404);
      expect(browser.document.getElementsByTagName("h1")[0].innerText).to.equal("Apocalyptic");
    });

  });
});
