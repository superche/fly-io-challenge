#!/usr/bin/env node

// A basic broadcast system
const Node = require('./core/node')

const node = new Node()
let peers = []
let messages = new Set()

node.on('topology', req => {
  peers = req.body.topology[node.nodeId]

  node.reply(req, {
    type: 'topology_ok',
  })
})

node.on('read', req => {
  node.reply(req, {
    type: 'read_ok',
    messages: Array.from(messages),
  })
})

node.on('broadcast', req => {
  const { message: msg } = req.body
  const { src } = req

  if (!messages.has(msg)) {
    messages.add(msg)
    for (const peer of peers) {
      if (peer === src) {
        continue
      }
      node.rpcWithRetry(peer, {
        type: 'broadcast',
        message: msg,
      })
    }
  }

  node.reply(req, {
    type: 'broadcast_ok',
  })
})
