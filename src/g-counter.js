#!/usr/bin/env node

// A stateless, grow-only counter
const Node = require('./core/node')
const { GCounter, PNCounter } = require('./utils/crdt')

const node = new Node()

var crdt = new PNCounter(new GCounter({}), new GCounter({}))

// Add new elements to our local state
node.on('add', function(req) {
  crdt = crdt.increment(node.nodeId, req.body.delta)

  node.reply(req, {
    type: 'add_ok',
  })
})

// When we get a read request, return our messages
node.on('read', function(req) {
  node.reply(req, {
    type: 'read_ok',
    value: crdt.value(),
  })
})

// When we receive a replication message, merge it into our CRDT
node.on('replicate', (req) => {
  crdt = crdt.merge(crdt.fromJSON(req.body.value))
})

// Replication
setInterval(() => {
  node.nodeIds.forEach(peer => {
    if (peer === node.nodeId) {
      return
    }

    node.rpc(peer, {
      type: 'replicate',
      value: crdt.toJSON(),
    }).catch(err => {
      console.warn('Replicate error:', err)
    })
  })
}, 5000)
