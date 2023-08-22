#!/usr/local/bin/node

// A globally-unique ID generation system
const Node = require('./core/node')

const node = new Node()
node.count = 0

node.on('generate', req => {
  const time = Math.floor(Date.now() / 1000)
  const id = `${time}${node.count}${node.nodeId}`
  node.count += 1

  node.reply(req, {
    type: 'generate_ok',
    id,
  })
})

node.main()
