#!/usr/local/bin/node

// A globally-unique ID generation system
const Node = require('./core/node')
const { generateId } = require('./utils/id')

const node = new Node()
node.snowflakeSequence = 0
node.lastTimestamp = 0

node.on('generate', async req => {
  const id = await generateId(node.nodeId)

  node.reply(req, {
    type: 'generate_ok',
    id,
  })
})
