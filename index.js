
process.env.CORE_LIB = true

var url = require('url')
var extend = require('extend')
var core = require('@request/core')
var Cookie = require('./lib/cookie')
var defaults = require('./lib/defaults')
var params = require('./lib/params')
var opts = require('./lib/options')
var getProxyFromURI = require('./lib/getProxyFromURI')


function initRequest (_options) {
  var options = core._lib.config.init(_options)
  var req = new core.Request(options.protocol)

  if (!options.hasOwnProperty('proxy')) {
    options.proxy = getProxyFromURI(options.url)
  }
  // if (options.proxy) {
  //   if (options.url.protocol === 'https:' && options.tunnel === undefined) {
  //     options.tunnel = true
  //   }
  // }

  // response
  function state (res) {
    req.response = res

    req.headers = options.headers.toObject()
    req.uri = options.url
    req.localAddress = options.localAddress
    req.agent = options.agent
    req.agentOptions = _options.agentOptions

    req.req = req._req
    res.request = req
    res.toJSON = function () {
      return {
        statusCode: res.statusCode,
        body: res.body,
        headers: res.headers,
        request: JSON.parse(JSON.stringify(req))
      }
    }
  }
  req.on('socket', state.bind())
  req.on('redirect', state.bind())
  req.on('onresponse', state.bind())
  // timing
  req.on('onresponse', function (res) {
    if (_options.time) {
      res.once('end', function () {
        res.elapsedTime = (new Date().getTime() - _options.startTime)
      })
    }
  })

  // request
  req.path = options.url.path
  // timing
  req.on('request', function () {
    if (_options.time && !_options.startTime) {
      _options.startTime = new Date().getTime()
    }
  })

  // qs
  core._lib.options.qs.request =  (function (qs) {
    return function (req, options) {
      qs(req, options)
      req.path = options.url.path
    }
  }(core._lib.options.qs.request))

  // auth
  core._lib.options.auth.request =  (function (auth) {
    return function (req, options) {
      auth(req, options)
      req.headers = options.headers.toObject()
      req.uri = options.url
      req.path = options.url.path
      req.body = options.body
      if (options.auth) {
        req._auth = options.auth
      }
    }
  }(core._lib.options.auth.request))

  // callback
  core._lib.options.callback.request =  (function (callback) {
    return function (req, options) {
      options.callback = options.callback.bind(req)
      callback(req, options)
    }
  }(core._lib.options.callback.request))

  // init request options
  core._lib.request(req, options)

  req.setHeader = function (key, value) {
    options.headers.set(key, value)
  }

  // create options methods
  req.qs = function (_options) {
    extend(true, options, {qs: _options})
    core._lib.options.qs.request(req, options)
    return req
  }
  req.form = function (_options) {
    extend(true, options, {form: _options})
    core._lib.options.form.request(req, options)
    return req
  }
  req.auth = function (user, pass, sendImmediately, bearer) {
    extend(true, options,
      {auth: {user: user, pass: pass, sendImmediately: sendImmediately, bearer: bearer}})
    core._lib.options.auth.request(req, options)
    return req
  }

  req.toJSON = function () {
    return {
      uri: req.uri,
      method: req.method,
      headers: req.headers
    }
  }

  return req
}

function client (uri, options, callback) {
  var options = client.init(uri, options, callback)

  function paramsHaveRequestBody(params) {
    return (
      params.body ||
      params.requestBodyStream ||
      (params.json && typeof params.json !== 'boolean') ||
      params.multipart
    )
  }
  if (options.method === 'HEAD' && paramsHaveRequestBody(options)) {
    throw new Error('HTTP HEAD requests MUST NOT include a request body.')
  }

  opts.prepare(options)

  // overwrite @request/core's entry point
  var req = initRequest(options)
  return req
}

client.init = params.init
client.initParams = client.init

client.jar = function (store) {
  return Cookie.jar(store)
}

client.cookie = function (str) {
  return Cookie.parse(str)
}

function verbFunc (verb) {
  var method = verb === 'del' ? 'DELETE' : verb.toUpperCase()
  return function (uri, options, callback) {
    var options = client.init(uri, options, callback)
    options.method = method
    return client(options, options.callback)
  }
}

client.get = verbFunc('get')
client.head = verbFunc('head')
client.post = verbFunc('post')
client.put = verbFunc('put')
client.patch = verbFunc('patch')
client.del = verbFunc('del')

client.defaults = function (options, requester) {
  return defaults.call(this, options, requester)
}

module.exports = client
