"use strict";

const assert = require("assert");
const NodeFetch = require("node-fetch");
const http = require("http");
const url = require("url");
const BrowserTab = require("./lib/BrowserTab");
const {version} = require("./package.json");
const {CookieAccessInfo, CookieJar, Cookie} = require("cookiejar");
const {normalizeHeaders, getLocationHost} = require("./lib/getHeaders");

module.exports = Tallahassee;

const kResponse = Symbol.for("response");
const kOrigin = Symbol.for("origin");

class OriginResponse {
  constructor(response, originHost, protocol) {
    this[kResponse] = response;
    const {path} = url.parse(response.url);
    this.url = originHost ? `${protocol}//${originHost}${path}` : response.url;
    this.status = response.status;
    this.ok = response.ok;
    response.headers.delete("_fl-origin");
    this.headers = response.headers;
  }
  text() {
    return this[kResponse].text();
  }
  json() {
    return this[kResponse].json();
  }
}

class Origin {
  constructor(origin) {
    this.origin = origin;
    this.type = typeof origin;
  }
  async init() {
    switch (this.type) {
      case "function": {
        const server = this.server = await this._startHttpServer(this.origin);
        return `http://127.0.0.1:${server.address().port}`;
      }
      case "number":
        return `http://127.0.0.1:${this.origin}`;
      case "string":
        return this.origin;
      default:
        return `http://127.0.0.1:${process.env.PORT}`;
    }
  }
  close() {
    const server = this.server;
    if (server) this.server = server.close();
  }
  _startHttpServer(requestListener) {
    const server = http.createServer(requestListener);
    return new Promise((resolve) => {
      server.listen(0, () => {
        return resolve(server);
      });
    });
  }
}

class WebPage {
  constructor(origin, jar, originRequestHeaders) {
    this[kOrigin] = origin;
    this.jar = jar;
    this.originRequestHeaders = originRequestHeaders;
    this.originHost = getLocationHost(originRequestHeaders);
    this.userAgent = `Tallahassee/${version}`;
    this.protocol = `${originRequestHeaders["x-forwarded-proto"] || "http"}:`;
    this.referrer = originRequestHeaders.referer;
  }
  async load(uri, headers, statusCode = 200) {
    const requestHeaders = normalizeHeaders(headers);
    if (requestHeaders["user-agent"]) this.userAgent = requestHeaders["user-agent"];

    if (requestHeaders.cookie) {
      const publicHost = getLocationHost(requestHeaders);
      const parsedUri = url.parse(uri);
      const cookieDomain = parsedUri.hostname || publicHost || this.originHost || "127.0.0.1";
      const isSecure = (parsedUri.protocol || this.protocol) === "https:";

      this.jar.setCookies(requestHeaders.cookie.split(";").map((c) => c.trim()).filter(Boolean), cookieDomain, "/", isSecure);
    }

    const resp = await this.fetch(uri, {
      method: "GET",
      headers: requestHeaders,
    });
    assert.equal(resp.status, statusCode, `Unexepected status code. Expected: ${statusCode}. Actual: ${resp.statusCode}`);
    assert(resp.headers.get("content-type").match(/text\/html/i), `Unexepected content type. Expected: text/html. Actual: ${resp.headers["content-type"]}`);
    const browser = new BrowserTab(this, resp);
    return browser.load();
  }
  async submit(uri, options) {
    const res = await this.fetch(uri, options);
    const response = await this.handleResponse(res, options);
    const browser = new BrowserTab(this, response);
    return browser.load();
  }
  async fetch(uri, requestOptions = {}) {
    this.numRedirects = 0;
    const res = await this.makeRequest(uri, requestOptions);
    return this.handleResponse(res, requestOptions);
  }
  async handleResponse(res, requestOptions) {
    const setCookieHeader = res.headers.raw()["set-cookie"];
    if (setCookieHeader) {
      const cookieDomain = new URL(res.url).hostname;
      for (const cookieStr of setCookieHeader) {
        const cookie = new Cookie(cookieStr);
        if (!cookie.domain) cookie.domain = cookieDomain;
        this.jar.setCookie(cookie.toString());
      }
    }

    const flOrigin = res.headers.get("_fl-origin");

    if (res.status > 300 && res.status < 309 && requestOptions.redirect !== "manual") {
      this.numRedirects++;
      if (this.numRedirects > 20) {
        throw new Error("Too many redirects");
      }
      let location = res.headers.get("location");
      if (flOrigin) {
        location = location.replace(flOrigin, "");
      }
      const redirectOptions = {...requestOptions};

      if (res.status === 307 || res.status === 308) {
        // NO-OP
      } else {
        redirectOptions.method = "GET";
        delete redirectOptions.body;
      }

      const redirectedRes = await this.makeRequest(location, redirectOptions);
      return this.handleResponse(redirectedRes, requestOptions);
    }

    if (flOrigin) {
      return new OriginResponse(res, this.originHost, this.protocol);
    }

    return res;
  }
  async makeRequest(uri, requestOptions = {method: "GET", headers: {}}) {
    let origin, flOrigin;
    const parsedUri = url.parse(uri);
    let headers = requestOptions.headers = normalizeHeaders(requestOptions.headers);
    const isLocal = uri.startsWith("/") || parsedUri.hostname === this.originHost;
    if (isLocal) {
      origin = new Origin(this[kOrigin]);
      flOrigin = await origin.init();
      uri = new URL(parsedUri.path, flOrigin).toString();
      headers = requestOptions.headers = {
        ...this.originRequestHeaders,
        ...headers,
      };
    } else {
      headers.host = parsedUri.host;
    }

    const publicHost = getLocationHost(headers);
    const cookieDomain = parsedUri.hostname || publicHost || this.originHost || "127.0.0.1";
    const isSecure = (parsedUri.protocol || this.protocol) === "https:";
    const accessInfo = CookieAccessInfo(cookieDomain, parsedUri.pathname, isSecure);

    const cookieValue = this.jar.getCookies(accessInfo).toValueString();
    if (cookieValue) headers.cookie = cookieValue;

    try {
      const response = await NodeFetch(uri, {...requestOptions, redirect: "manual"});
      if (isLocal) {
        response.headers.set("_fl-origin", flOrigin);
      }
      return response;
    } finally {
      if (origin) origin.close();
    }
  }
}

function Tallahassee(origin, options = {}) {
  if (!(this instanceof Tallahassee)) return new Tallahassee(origin, options);
  this[kOrigin] = origin;
  this.jar = new CookieJar();
  this.options = options;
}

Tallahassee.prototype.navigateTo = async function navigateTo(linkUrl, headers = {}, statusCode = 200) {
  const requestHeaders = {
    ...normalizeHeaders(this.options.headers),
    ...normalizeHeaders(headers),
  };

  const setCookieHeader = requestHeaders["set-cookie"];
  if (setCookieHeader) {
    for (const cookieStr of Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]) {
      const cookie = new Cookie(cookieStr);
      this.jar.setCookie(cookie.toString());
    }
    requestHeaders["set-cookie"] = undefined;
  }

  const webPage = new WebPage(this[kOrigin], this.jar, requestHeaders);
  return webPage.load(linkUrl, requestHeaders, statusCode);
};
