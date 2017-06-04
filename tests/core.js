
var path = require('path')
var spawn = require('child_process').spawn
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2))


var suite = [
  {test: 'agent', excluded: true},
  {test: 'agentOptions', excluded: true},
  {test: 'baseUrl', exclude: 4},
  {test: 'basic-auth'},
  {test: 'bearer-auth', exclude: 2},
  {test: 'body'},
  {test: 'cookies'},
  {test: 'defaults'},
  {test: 'digest-auth'},
  {test: 'emptyBody', exclude: 1},
  {test: 'errors', excluded: true},
  {test: 'event-forwarding'},
  {test: 'follow-all-303'},
  {test: 'follow-all'},
  {test: 'form-data-error', excluded: true},
  {test: 'form-data'},
  {test: 'form-urlencoded'},
  {test: 'form', excluded: true},
  {test: 'gzip', exclude: 1},
  {test: 'har'},
  {test: 'hawk'},
  {test: 'headers'},
  {test: 'http-signature'},
  {test: 'httpModule', excluded: true},
  {test: 'https'},
  {test: 'isUrl', exclude: 1},
  {test: 'json-request'},
  {test: 'localAddress'},
  {test: 'multipart-encoding', excluded: true},
  {test: 'multipart'},
  {test: 'node-debug', excluded: true},
  {test: 'oauth'},
  {test: 'onelineproxy'},
  {test: 'option-reuse'},
  {test: 'params'},
  {test: 'piped-redirect'},
  {test: 'pipes', exclude: 2},
  {test: 'pool', excluded: true},
  {test: 'promise'},
  {test: 'proxy-connect'},
  {test: 'proxy'},
  {test: 'qs'},
  {test: 'redirect-auth'},
  {test: 'redirect-complex'},
  {test: 'redirect'},
  {test: 'rfc3986'},
  {test: 'timeout'},
  {test: 'timing'},
  {test: 'toJSON'},
  {test: 'tunnel'},
  {test: 'unix'}
]


var output = {
  cleanup: function (file, tests) {
    var fs = require('fs')
    var code = fs.readFileSync(file, 'utf8')
    tests.forEach(function (test) {
      code = code.replace(test.regex, test.end)
    })
    eval(code)
  },
  tape: function () {
    suite.forEach(function (entry) {
      var file = path.join(__dirname, 'test-' + entry.test + '.js')

      // options.agent doesn't work because in request's callback
      // the underlying socket is still kept as active in agent.sockets
      // where using the core's http module or @request/core the underlying socket
      // is already freed and ready to reuse in agent.freeSockets
      //
      // the next two tests are about the forever option and method
      // that are deprecated
      if (entry.test === 'agent') {
        return
      }

      // two tests about agentOptions and pool
      else if (entry.test === 'agentOptions') {
        return
      }

      // exclude the 4 tests that's expected to throw an error
      else if (entry.test === 'baseUrl') {
        output.cleanup(file, [
          {regex: /tape\('error when baseUrl[\s\S]+tape\('cleanup/, end: 'tape(\'cleanup'}
        ])
      }

      // 2 tests are skipped for auth.bearer = undefined | null
      else if (entry.test === 'bearer-auth') {
        output.cleanup(file, [
          {regex: /tape\('no auth method'[\s\S]+tape\('cleanup/, end: 'tape(\'cleanup'}
        ])
      }

      // 1 test expects body to be undefined if JSON.parse fails
      // @request/core is returning the original string body instead
      else if (entry.test === 'emptyBody') {
        output.cleanup(file, [
          {regex: /tape\('empty JSON body'[\s\S]+tape\('cleanup/, end: 'tape(\'cleanup'}
        ])
      }

      // not implemented error messages
      else if (entry.test === 'errors') {
        return
      }

      // uses not implemented form-data methods - append and getLength
      else if (entry.test === 'form') {
        return
      }
      else if (entry.test === 'form-data-error') {
        return
      }

      // 1 test expects a string chunk inside the on.data event
      // but that's a bad idea when useing iconv-lite
      // https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding
      else if (entry.test === 'gzip') {
        output.cleanup(file, [
          {regex: /tape\('supports character encoding with gzip encoding'[\s\S]+tape\('transparently supports gzip error to callbacks/, end: 'tape(\'transparently supports gzip error to callbacks'}
        ])
      }

      // not implement feature in @request/legacy
      // tests about non documented httpModules option
      // https://github.com/request/request/pull/112
      else if (entry.test === 'httpModule') {
        return
      }

      // 1 test fails - options.uri is a required argument
      else if (entry.test === 'isUrl') {
        output.cleanup(file, [
          {regex: /tape\('hostname and port 3[\s\S]+tape\('hostname and query string/, end: 'tape(\'hostname and query string'}
        ])
      }

      // non implemented multipart API
      else if (entry.test === 'multipart-encoding') {
        return
      }

      // @request/log is used instead
      else if (entry.test === 'node-debug') {
        return
      }

      else if (entry.test === 'pipes') {
        output.cleanup(file, [
          // piping from a file sets the content-length - I think that's correct
          {regex: /testPipeFromFile\('piping from a file'[\s\S]+testPipeFromFile/, end: 'testPipeFromFile'},
          // no such error handling
          {regex: /tape\('piping to a request object with invalid uri'[\s\S]+tape\('piping to a request object with a json body/, end: 'tape(\'piping to a request object with a json body'}
        ])
      }

      // mostly about the non supported forever-agent
      else if (entry.test === 'pool') {
        return
      }

      // ok
      else {
        require(file)
      }
    })
  },
  taper: function () {
    var files = suite.map(function (entry) {
      return path.join(__dirname, 'test-' + entry.test + '.js')
    })

    var taper = spawn('taper', files)
    taper.stdout.pipe(process.stdout)
  }
}


if (argv.m == 'taper') {
  output.taper()
}
else if (argv.m == 'tape') {
  output.tape()
}
else {
  output.taper()
}
