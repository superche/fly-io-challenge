#!/usr/local/bin/node

// A globally-unique ID generation system
const Node = require('./core/node')

const sleepUntilNextMillisecond = () => new Promise(
  resolve => setTimeout(resolve, 1)
)
const MAX_SEQUENCE = 1 << 12
const simpleSnowflake = async node => {
  let timestamp = Date.now()

  if (timestamp < node.lastTimestamp) {
    throw new Error('Clock moved backwards')
  } else if (timestamp === node.lastTimestamp) {
    node.snowflakeSequence += 1
    if (node.snowflakeSequence >= MAX_SEQUENCE) {
      await sleepUntilNextMillisecond()
      timestamp = Date.now()
      node.snowflakeSequence = 0
    }
  } else {
    // timestamp > lastTimestamp
    node.snowflakeSequence = 0
  }

  node.lastTimestamp = timestamp

  return `${timestamp}${node.nodeId}${node.snowflakeSequence}`
}

const node = new Node()
node.snowflakeSequence = 0
node.lastTimestamp = 0

node.on('generate', async req => {
  const id = await simpleSnowflake(node)

  node.reply(req, {
    type: 'generate_ok',
    id,
  })
})

node.main()
