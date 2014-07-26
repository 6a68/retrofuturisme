var fs = require('fs');
var gopherize = require('gopher-menudle');
var net = require('net');

// XXX move to lib/routes.js?
var routeMap = {
  'Foo': {
    type: '1',
    path: './pages/foo',
    title: 'The Foo Page'
  },
  'Bar': {
    type: 'h',
    path: './pages/bar',
    title: 'The Bar Page'
  },
  'default': {
    type: '1',
    path: './pages/default',
    title: 'R E T R O F U T U R I S M E'
  }
};

// XXX move to lib/config.js? or json?
var port = 7070;
var host = 'localhost';

// TODO send console to syslog
function onError(e, sock) {
  if (!e) { return; }
  console.log(e);
  sock.write(gopherize('Oh Noes, something broke. Sorry bubs.'));
  return sock.end();
}

net.createServer(function (socket) {
  socket.setEncoding('ascii');
  socket.on('data', function (data) {
    // XXX extract this into a router function
    // trim those trailing linebreaks to make routing simpler
    var endpoint = data.trim();
    // oh, also strip out any leading slash
    if (endpoint.indexOf('/') === 0) { endpoint = endpoint.substr(1); }
    // route the bare URL to the default route
    if (!endpoint) { endpoint = 'default'; }
    // they asked for something that doesn't exist. bail.
    if (!(endpoint in routeMap)) {
      var msg = 'Error: attempted to reach endpoint "' + endpoint + '".';
      return onError(msg, socket);
    }
    // XXX extract this into an async template loader function
    fs.realpath(routeMap[endpoint]['path'], function(err, resolvedPath) {
      if (err) { return onError(e, socket); }
      fs.readFile(resolvedPath, 'ascii', function (err, contents) {
        if (err) { return onError(e, socket); }

        var page = '';

        // XXX extract this bit to a gophermap page templating function
        if (routeMap[endpoint]['type'] == '1') {
          // add the links. just one level deep for now.
          Object.keys(routeMap).forEach(function (endpoint) {
            if (endpoint == 'default') { return; } // don't provide a top-level link
            var linky = ':link ' + routeMap[endpoint]['type'] + ' ' +
                    host + ':' + port + '/' + endpoint + ' ' +
                    routeMap[endpoint]['title'] + '\n';
            contents += linky;
          });
          page = gopherize(contents);
        // XXX we might want to template some navigation for html pages?
        } else {
          page = contents;
        }
        socket.write(page);
        socket.end();
      });
    });
  });
  socket.on('end', function() {
    console.log('ending session');
    socket.end();
  });
}).listen(port, host);

console.log('running on ' + host + ':' + port);

// I learned some stuff from reading https://gist.github.com/mcroydon/485609, thanks Matt
