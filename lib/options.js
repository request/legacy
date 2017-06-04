
var Headers = require('@request/headers')
var har = require('./har')
var baseURL = require('./base-url')


function qs (options) {
  if (options.useQuerystring) {
    options.parse.querystring = options.qsParseOptions || {}
    options.stringify.querystring = options.qsStringifyOptions || {}
  }
  else {
    if (options.qsParseOptions) {
      options.parse.qs = options.qsParseOptions
    }
    if (options.qsStringifyOptions) {
      options.stringify.qs = options.qsStringifyOptions
    }
  }
  delete options.useQuerystring
  delete options.qsParseOptions
  delete options.qsStringifyOptions
}

function redirect (options) {
  if (options.redirect === undefined && options.followRedirect !== false) {
    options.redirect = {max: 10}
  }
  if (options.followAllRedirects) {
    options.redirect.all = true
  }
  if (typeof options.followRedirect === 'function') {
    options.redirect.allow = options.followRedirect
  }
  if (options.removeRefererHeader) {
    options.redirect.removeReferer = options.removeRefererHeader
  }
  if (options.maxRedirects) {
    options.redirect.max = options.maxRedirects
  }
}

function json (options) {
  var regex = /^application\/x-www-form-urlencoded\b/
  var type = options.headers.get('content-type')
  if (options.json) {
    if (options.parse.json === undefined) {
      options.parse.json = true
    }
    if (typeof options.json === 'boolean') {
      if (options.body !== undefined && !regex.test(type)) {
        options.json = options.body
        delete options.body
      }
      else {
        delete options.json
      }
    }
  }
  if (options.jsonReviver) {
    options.parse.json = options.jsonReviver
  }
}

function form (options) {
  var regex = /^application\/x-www-form-urlencoded\b/
  var type = options.headers.get('content-type')
  if (options.body !== undefined && regex.test(type)) {
    options.form = options.body
    delete options.body
  }
}

function formData (options) {
  function generateBoundary () {
    // This generates a 50 character boundary similar to those used by Firefox
    // They are optimized for boyer-moore parsing
    var boundary = '--------------------------'
    for (var i = 0; i < 24; i++) {
      boundary += Math.floor(Math.random() * 10).toString(16)
    }

    return boundary
  }
  if (options.formData) {
    if (!options.headers.get('content-type')) {
      options.headers.set(
        'content-type', 'multipart/form-data; boundary=' + generateBoundary())
    }
    options.multipart = options.formData
  }
}

function proxy (options) {
  if (options.proxy) {
    if (options.proxyHeaderWhiteList || options.proxyHeaderExclusiveList) {
      options.proxy = {
        url: options.proxy,
        headers: {
          allow: options.proxyHeaderWhiteList,
          exclusive: options.proxyHeaderExclusiveList
        }
      }
    }
  }
}

function auth (options) {
  if (options.auth) {
    if (typeof options.auth.bearer === 'function') {
      options.auth.bearer = options.auth.bearer()
    }
  }
}

function agent (options) {
  if (options.agentOptions) {

  }
  if (options.agentClass) {
    options.agent = new options.agentClass(options.agentOptions)
  }
}

exports.prepare = function (options) {
  if (options.har) {
    har(options)
  }

  options.headers = new Headers(options.headers)

  if (options.baseUrl) {
    baseURL(null, options)
  }

  if (options.parse === undefined) {
    options.parse = {}
  }
  if (options.stringify === undefined) {
    options.stringify = {}
  }

  if (options.encoding === null) {
    options.encoding = 'binary'
  }

  if (options.jar) {
    options.cookie = options.jar
  }

  if (options.length === undefined) {
    options.length = true
  }

  if (options.end === undefined) {
    options.end = true
  }

  redirect(options)
  agent(options)
  qs(options)
  json(options)
  form(options)
  formData(options)
  proxy(options)
  auth(options)

  options.headers = options.headers.toObject()
}
