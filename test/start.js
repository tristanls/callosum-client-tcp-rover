/*

start.js - callosumClientRover.start() test

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

"use strict";

var CallosumClientRover = require('../index.js'),
    net = require('net');

var test = module.exports = {};

test['start() selects a random server to connect to immediately and then every ROVING_INTERVAL'] = function (test) {
    test.expect(3);
    var rover = new CallosumClientRover({ROVING_INTERVAL: 100});
    rover.addServer('first', {host: 'localhost', port: 4040});
    rover.on('unreachable', function (id, server) {
        test.equal(id, 'first');
    });
    rover.start();
    setTimeout(function () {
        clearInterval(rover.intervalId);
        test.done();
    }, 250); // immediately, ~100, ~200
};

test["started rover emits 'connection' event when successfully connected and received slot info"] = function (test) {
    test.expect(1);
    var rover = new CallosumClientRover({ROVING_INTERVAL: 20000});
    rover.addServer('first', {host: 'localhost', port: 4040});
    var server = net.createServer(function (connection) {
        connection.write('173\r\n');
    });
    rover.on('connection', function (slot, socket) {
        test.equal(slot, 173);
        socket.end();
        clearInterval(rover.intervalId);
        server.close(function () {
            test.done();
        });
    });
    server.listen(4040, function () {
        rover.start();
    });
};

test["started rover emits 'error' event server responds with invalid protocol"] = function (test) {
    test.expect(1);
    var rover = new CallosumClientRover({ROVING_INTERVAL: 20000});
    rover.addServer('first', {host: 'localhost', port: 4040});
    var server = net.createServer(function (connection) {
        connection.write('foo\r\n');
    });
    rover.on('error', function (error) {
        test.ok(error);
        clearInterval(rover.intervalId);
        server.close(function () {
            test.done();
        });
    });
    server.listen(4040, function () {
        rover.start();
    });
};