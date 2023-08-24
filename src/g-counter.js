#!/usr/local/bin/node

// A stateless, grow-only counter
const Node = require('./core/node')

const node = new Node()

const KEY = 'g-counter'

// CRDT
// interface Op {
//   time: number
//   nodeId: string
//   type: 'add' | 'remove'
//   key: string
//   value: number
// }
const stateZero = new Map()
stateZero.set(KEY, {
  type: 'add',
  key: KEY,
  value: 0,
})
let processState = {
  time: 0,
  state: stateZero
}

const apply = (s, op) => {
  const newProcessState = {
    time: Math.max(s.time, op.time) + 1,
    state: new Map(s.state),
  }
  if (!newProcessState.state.has(op.key)) {
    newProcessState.state.set(op.key, op)
  } else {
    const oldOp = newProcessState.state.get(op.key)
    if (op.time > oldOp.time || (op.time === oldOp.time && op.nodeId > oldOp.nodeId)) {
      newProcessState.state.set(op.key, op)
    }
  }

  return newProcessState
}

const checkState = (s, op) => {
  return true
}

node.on('add', req => {
  console.warn('on add. delta:', req.body.delta)
  const oldOp = processState.state.get(KEY)
  const op = {
    time: processState.time,
    nodeId: node.nodeId,
    type: 'add',
    key: KEY,
    value: oldOp.value + req.body.delta,
  }
  processState = apply(processState, op)

  node.reply(req, {
    type: 'add_ok',
  })
})

node.on('read', req => {
  const oldOp = processState.state.get(KEY)

  node.reply(req, {
    type: 'read_ok',
    value: oldOp.value,
  })
})

node.on('replicate', req => {
  const op = req.body
  processState = apply(processState, op)
})

setInterval(() => {
  console.warn('Replicate!')
  for (const peer of (node.nodeIds || [])) {
    if (peer !== node.nodeId) {
      node.rpc(peer, {
        time: processState.time,
        nodeId: node.nodeId,
        type: 'replicate',
        key: KEY,
        value: processState.state.get(KEY).value,
      }).catch(err => {
        console.warn('Replicate error:', err)
      })
    }
  }
}, 300)
