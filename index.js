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
var host = '127.0.0.1';

function onError(e, sock) {
  if (!e) { return; }
  console.log(err);
  sock.write(gopherize('Oh Noes, something broke. Sorry bubs.'));
  return sock.end();
}

net.createServer(function (socket) {
  socket.setEncoding('ascii');
  socket.on('data', function (data) {
    // trim those trailing linebreaks to make routing simpler
    console.log("the raw data in the socket is " + data);
    var endpoint = data.trim();
    if (!endpoint) {
      // the default empty route
      console.log('serving default endpoint');
      var page = 'i\tfake\t(NULL)\t0\r\n' +
        'i__ R E T R O F U T U R I S M E __\tfake\t(NULL)\t0\r\n' +
        'iHere we are in gopherspace. Let\'s talk about stuff.\tfake\t(NULL)\t0\r\n';
      // add the links. just one level deep for now.
      Object.keys(routeMap).forEach(function (endpoint) {
        /*
        page += ':link 0 ' +
                host + ':' + port + '/' + endpoint + ' ' +
                routeMap[endpoint]['title'] +
                '\n';
        */
        page += ['0'+routeMap[endpoint]['title'], '/'+endpoint, host, port].join('\t');
        page += '\r\n';
      });

      console.log(page);
      socket.write(page);
      socket.end();
    } else if (endpoint in routeMap) {
      console.log('hit ' + endpoint + ' route');
      console.log('routeMap.endpoint is ' + JSON.stringify(routeMap[endpoint]));
      console.log('routeMap.endpoint.path is ' + routeMap[endpoint]['path']);
      fs.realpath(routeMap[endpoint]['path'], function(err, resolvedPath) {
        if (err) { return onError(e, socket); }
        fs.readFile(resolvedPath, 'ascii', function (err, contents) {
          if (err) { return onError(e, socket); }
          socket.write(gopherize(contents));
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
