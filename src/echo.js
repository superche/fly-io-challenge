#!/usr/local/bin/node

// A basic echo server
var Node = require('./core/node')

const node = new Node();

node.on('echo', req => {
  node.reply(req, {
    type: 'echo_ok',
    echo: req.body.echo
  });
})

node.main()
