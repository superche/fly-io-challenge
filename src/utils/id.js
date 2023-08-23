const sleepUntilNextMillisecond = () => new Promise(
  resolve => setTimeout(resolve, 1)
)

const MAX_SEQUENCE = 1 << 12

let sequence = 0
let lastTimestamp = 0

const simpleSnowflake = async nodeId => {
  let timestamp = Date.now()

  if (timestamp < lastTimestamp) {
    throw new Error('Clock moved backwards')
  } else if (timestamp === lastTimestamp) {
    sequence += 1
    if (sequence >= MAX_SEQUENCE) {
      await sleepUntilNextMillisecond()
      timestamp = Date.now()
      sequence = 0
    }
  } else {
    // timestamp > lastTimestamp
    sequence = 0
  }

  lastTimestamp = timestamp

  return `${timestamp}${nodeId}${sequence}`
}

let nextMsgId = 0
const generateRPCMessageId = () => {
  const id = nextMsgId
  nextMsgId += 1
  return id
}

exports.generateId = simpleSnowflake
exports.generateRPCMessageId = generateRPCMessageId
