
module.exports = function baseURL (req, options) {
  options.url = options.url || options.uri

  if (typeof options.baseUrl !== 'string') {
    return req.emit('error', new Error('options.baseUrl must be a string'))
  }

  if (typeof options.url !== 'string') {
    return req.emit('error', new Error('options.uri must be a string when using options.baseUrl'))
  }

  if (options.url.indexOf('//') === 0 || options.url.indexOf('://') !== -1) {
    return req.emit('error', new Error('options.uri must be a path when using options.baseUrl'))
  }

  // Handle all cases to make sure that there's only one slash between
  // baseUrl and uri.
  var baseUrlEndsWithSlash = options.baseUrl.lastIndexOf('/') === options.baseUrl.length - 1
  var uriStartsWithSlash = options.url.indexOf('/') === 0

  if (baseUrlEndsWithSlash && uriStartsWithSlash) {
    options.url = options.baseUrl + options.url.slice(1)
  }
  else if (baseUrlEndsWithSlash || uriStartsWithSlash) {
    options.url = options.baseUrl + options.url
  }
  else if (options.url === '') {
    options.url = options.baseUrl
  }
  else {
    options.url = options.baseUrl + '/' + options.url
  }
  delete options.baseUrl
}
