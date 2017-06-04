
var extend = require('extend')
var params = require('./params')


function wrap (method, defaults, requester, verb) {

  return function (uri, options, callback) {
    var current = params.init(uri, options, callback)

    var all = {}
    extend(true, all, defaults, current)

    if (verb) {
      all.method = (verb === 'del' ? 'DELETE' : verb.toUpperCase())
    }

    if (typeof requester === 'function') {
      method = requester
    }

    return method(all, all.callback)
  }
}

function defaults (options, requester) {
  var self = this
  options = options || {}

  if (typeof options === 'function') {
    requester = options
    options = {}
  }

  var defaults      = wrap(self, options, requester)

  var verbs = ['get', 'head', 'post', 'put', 'patch', 'del']
  verbs.forEach(function (verb) {
    defaults[verb]  = wrap(self[verb], options, requester, verb)
  })

  defaults.cookie   = wrap(self.cookie, options, requester)
  defaults.jar      = self.jar
  defaults.defaults = self.defaults

  return defaults
}

module.exports = defaults
