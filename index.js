var fs = require('fs');
var gopherize = require('gopher-menudle');
var net = require('net');

// XXX move to a config file?
var routeMap = {
  'Foo': {
    path: './pages/foo',
    title: 'The Foo Page'
  },
  'Bar': {
    path: './pages/bar',
    title: 'The Bar Page'
  }
};

// XXX this too?
var port = 7070;
var host = 'localhost';

function onError(e, sock) {
  if (!e) { return; }
  console.log(err);
  sock.write(gopherize('Oh Noes, something broke. Sorry bubs.'));
  return sock.end();
}

net.createServer(function (socket) {
  socket.setEncoding('ascii');
  socket.on('data', function (data) {
    console.log("the raw data in the socket is " + data);
    // trim those trailing linebreaks to make routing simpler
    var endpoint = data.trim();
    // oh, also strip out any leading slash
    if (endpoint.indexOf('/') === 0) { endpoint = endpoint.substr(1); }

    // finally, actually route
    if (!endpoint) {
      // the default empty route
      var page = '';
      console.log('serving default endpoint');
      fs.realpath('./pages/default', function(err, resolvedPath) {
        if (err) { return onError(e, socket); }
        fs.readFile(resolvedPath, 'ascii', function (err, contents) {
          if (err) { return onError(e, socket); }
          page += contents;
          // add the links. just one level deep for now.
          Object.keys(routeMap).forEach(function (endpoint) {
            var linky = ':link 0 ' +
                    host + ':' + port + '/' + endpoint + ' ' +
                    routeMap[endpoint]['title'] + '\n';
            page += linky;
          });

          var rendered = '';
          page.split('\n').forEach(function (item) {
            console.log('about to gopherize ' + item);
            var gopherized = gopherize(item);
            console.log('gopherized into ' + gopherized);
            rendered += gopherize(item);
          });
          console.log(rendered);
          socket.write(rendered);
          socket.end();
        });
      });
    } else if (endpoint in routeMap) {
      console.log('hit ' + endpoint + ' route');
      console.log('routeMap.endpoint is ' + JSON.stringify(routeMap[endpoint]));
      console.log('routeMap.endpoint.path is ' + routeMap[endpoint]['path']);
      fs.realpath(routeMap[endpoint]['path'], function(err, resolvedPath) {
        if (err) { return onError(e, socket); }
        fs.readFile(resolvedPath, 'ascii', function (err, contents) {
          if (err) { return onError(e, socket); }
          // var page = '';
          //contents.split('\n').forEach(function(line) { page += gopherize(line); });
          // socket.write(page);
          var page = gopherize(contents);
          console.log(page);
          socket.write(page);
          socket.end();
        });
      });
    } else {
      socket.write(gopherize('I don\'t know what this is supposed to be.'));
      socket.end();
    }
  });
  socket.on('end', function() {
    console.log('ending session');
    socket.end();
  });
}).listen(port, host);

console.log('running on ' + host + ':' + port);

// I learned some stuff from reading https://gist.github.com/mcroydon/485609, thanks Matt
