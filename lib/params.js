
var extend = require('extend')


exports.init = function (uri, options, callback) {
  if (typeof options === 'function') {
    callback = options
  }

  var result = {}
  if (typeof options === 'object') {
    extend(result, options, {uri: uri})
  }
  else if (typeof uri === 'string') {
    extend(result, {uri: uri})
  }
  else {
    extend(result, uri)
  }

  if (callback) {
    result.callback = callback
  }
  return result
}
