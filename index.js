/*

index.js - "callosum-client-tcp-rover": TCP client rover for Callosum: a 
                   self-balancing distributed services protocol

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

var events = require('events'),
    net = require('net'),
    util = require('util');

/*
  * `options`: _Object_
    * `ROVING_INTERVAL`: _Integer_ _(Default: 1000)_ Interval in milliseconds 
            between connection attempts.
    * `servers`: _Object_ _(Default: {})_ Map, by id, of servers to initialize with.
*/
var CallosumClientRover = module.exports = function CallosumClientRover (options) {
    var self = this;
    events.EventEmitter.call(self);

    options = options || {};

    self.intervalId = null;
    self.ROVING_INTERVAL = options.ROVING_INTERVAL || 1000;
    self.servers = options.servers || {};
};

util.inherits(CallosumClientRover, events.EventEmitter);

/*
  * `id`: _String_ Server identifier.
  * `server`: _Object_
    * `host`: _String_ Host.
    * `port`: _Integer_ Port.
*/
CallosumClientRover.prototype.addServer = function addServer (id, server) {
    var self = this;

    self.servers[id] = server;
};

/*
_**CAUTION: reserved for internal use**_
*/
CallosumClientRover.prototype.connect = function connect () {
    var self = this;

    var serverIds = Object.keys(self.servers);
    if (serverIds.length == 0)
        return self.emit('error', new Error('No servers to contact'));

    var randIndex = Math.floor(Math.random() * serverIds.length);
    var serverId = serverIds[randIndex];
    var randServer = self.servers[serverId];
    
    var client = net.connect(randServer);

    var dataHandler = function (chunk) {
        var data = chunk.toString('utf8');
        if (!data.match(/^\d+\r\n$/)) {
            client.end();
            return self.emit('error', new Error('Invalid protocol'));
        }

        var slot = parseInt(chunk.toString('utf8'));
        client.removeListener('data', dataHandler);
        client.removeListener('error', errorHandler);
        self.emit('connection', slot, client);
    };

    var errorHandler = function (error) {
        self.emit('unreachable', serverId, randServer);
        client.end();
    };

    client.on('data', dataHandler); 
    client.on('error', errorHandler);
};

/*
  * `id`: _String_ Server identifier.
*/
CallosumClientRover.prototype.dropServer = function dropServer (id) {
    var self = this;

    delete self.servers[id];
};

CallosumClientRover.prototype.start = function start () {
    var self = this;

    if (self.intervalId)
        clearInterval(self.intervalId);

    self.intervalId = setInterval(self.connect.bind(self), self.ROVING_INTERVAL);
    self.connect();
};