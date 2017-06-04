'use strict'

var tough = require('tough-cookie')


function RequestJar (store) {
  this._jar = new tough.CookieJar(store, {looseMode: true})
}

RequestJar.prototype.setCookie = function (cookieOrStr, uri, options) {
  return this._jar.setCookieSync(cookieOrStr, uri, options || {})
}

RequestJar.prototype.getCookieString = function (uri) {
  return this._jar.getCookieStringSync(uri)
}

RequestJar.prototype.getCookies = function (uri) {
  return this._jar.getCookiesSync(uri)
}

RequestJar.prototype.setCookieSync = function (cookieOrStr, uri, options) {
  return tough.CookieJar.prototype.setCookieSync.call(this._jar, cookieOrStr, uri, options || {})
}
RequestJar.prototype.getCookieStringSync = function (uri) {
  return tough.CookieJar.prototype.getCookieStringSync.call(this._jar, uri)
}
RequestJar.prototype.getCookiesSync = function (uri) {
  return tough.CookieJar.prototype.getCookiesSync.call(this._jar, uri)
}


exports.parse = function (str) {
  if (str && str.uri) {
    str = str.uri
  }
  if (typeof str !== 'string') {
    throw new Error('The cookie function only accepts STRING as param')
  }
  return tough.Cookie.parse(str, {loose: true})
}

exports.jar = function (store) {
  return new RequestJar(store)
}
