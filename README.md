# callosum-client-tcp-rover

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/callosum-client-tcp-rover.png)](http://npmjs.org/package/callosum-client-tcp-rover)

TCP Client rover for [Callosum](https://github.com/tristanls/callosum): a self-balancing distributed services protocol.

## Usage

```javascript
var ClientRover = require('callosum-client-tcp-rover');
var clientRover = new ClientRover({
    ROVING_INTERVAL: 1000, // milliseconds
    servers: {
        'localhost:4040': {host: 'localhost', port: 4040},
        'localhost:4041': {host: 'localhost', port: 4041}
    }
});

clientRover.on('error', function (error) {
    console.log(error); 
});

clientRover.on('unreachable', function (id, server) {
    console.log('server with id ' + id + ' is unreachable');
    console.dir(server); // for example: {host: 'localhost', port: 4041}
});

clientRover.on('connection', function (slot, socket) {
    console.log('new connection with slot number ' + slot);
    // keep socket open or close it depending on client configuration and slot
});

// start requesting connections from servers every ROVING_INTERVAL
clientRover.start(); 

// add additional servers as they become available
clientRover.addServer('localhost:4042', {host: 'localhost', port: 4042});

// remove servers by id
clientRover.dropServer('localhost:4042');
```

## Tests

    npm test

## Overview

TCP Client rover for [Callosum](https://github.com/tristanls/callosum): a self-balancing distributed services protocol.

The rover maintains a list of servers it was given (with follow-on updates) and every ROVING_INTERVAL selects a server at random to connect to. Upon connection, as dictated by the Callosum TCP Server Protocol, a slot number will be sent to the rover from the server. For example, for slot `13`:

    13\r\n

The rover will parse this slot number and then emit a `connection` event with the `slot` and the `socket`. It is then up to the TCP Client to decide whether the connection should be kept or not. Rover no longer maintains knowledge of it and goes to sleep until woken up again according to ROVING_INTERVAL.

## Documentation

### CallosumClientRover

**Public API**

  * [new CallosumClientRover(options)](#new-callosumclientroveroptions)
  * [callosumClientRover.addServer(id, server)](#callosumclientroveraddserverid-server)
  * [callosumClientRover.dropServer(id)](#callosumclientroverdropserverid)
  * [callosumClientRover.start()](#callosumclientroverstart)
  * [Event 'connection'](#event-connection)
  * [Event 'error'](#event-error)
  * [Event 'unreachable'](#event-unreachable)

### new CallosumClientRover(options)

  * `options`: _Object_
    * `ROVING_INTERVAL`: _Integer_ _(Default: 1000)_ Interval in milliseconds between connection attempts.
    * `servers`: _Object_ _(Default: {})_ Map, by id, of servers to initialize with.

Creates a new CallosumClientRover instance.

### callosumClientRover.addServer(id, server)

  * `id`: _String_ Server identifier.
  * `server`: _Object_
    * `host`: _String_ Host.
    * `port`: _Integer_ Port.

Adds the server to be considered for new connections.

### callosumClientRover.connect()

_**CAUTION: reserved for internal use**_

Executes a connection attempt to a random server.

### callosumClientRover.dropServer(id)

  * `id`: _String_ Server identifier.

Removes the server from being selected for new connections.

### callosumClientRover.start()

Immediately attempts to connect to a random Callosum server and then continues the attempts every `ROVING_INTERVAL`.

### Event `connection`

  * `function (slot, socket) {}`
    * `slot`: _Integer_ Slot number for this connection.
    * `socket`: _Socket object_ The socket object for this connection.

Emitted when a successful connection to a random server is made.

### Event `error`

  * `function (error) {}`
    * `error`: _Object_ An error that occurred.

Emitted when CallosumClientRover encounters an error. If no handler is registered, an exception will be thrown.    

### Event `unreachable`

  * `function (id, server) {}`
    * `id`: _String_ Id of the server that is unreachable.
    * `server`: _Object_
      * `host`: _String_ Host.
      * `port`: _Integer_ Port.

Emitted when a connection to a random server is attempted but the server is unreachable.

## Sources

  * [Boxcar: A self-balacing distributed services protocol](http://engineering.indeed.com/blog/2012/12/boxcar-self-balancing-distributed-services-protocol/)
  * [@IndeedEng: Boxcar: A self-balancing distributed services protocol](https://engineering.indeed.com/blog/2013/11/indeedeng-boxcar-a-self-balancing-distributed-services-protocol-slides-video/)