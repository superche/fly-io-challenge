#!/usr/bin/env node

// A replicated log service

const Node = require('./core/node')

const node = new Node()

const log = {
  messages: new Map(), // key -> msg[]
  syncOffset: new Map(), // key -> offset
  diffs: new Map(), // node -> key -> msg[]
}

function send(key, msg) {
  if (!log.messages.has(key)) {
    log.messages.set(key, new Array())
  }
  const arr = log.messages.get(key)
  arr.push(msg)
  const offset = arr.length - 1

  // update log.diffs for replication
  node.nodeIds.forEach(peer => {
    if (peer === node.nodeId) {
      return
    }
    if (!log.diffs.has(peer)) {
      log.diffs.set(peer, new Map())
    }
    const nodeDiffs = log.diffs.get(peer)
    if (!nodeDiffs.has(key)) {
      nodeDiffs.set(key, new Array())
    }

    const msgs = nodeDiffs.get(key)
    msgs.push(msg)
  })

  // update log.syncOffset for commit
  if (!log.syncOffset.has(key)) {
    log.syncOffset.set(key, 0)
  }
  if (log.syncOffset.get(key) <= offset && node.nodeIds.length === 1) {
    // single node
    log.syncOffset.set(key, offset + 1)
  }

  return offset
}

function poll(key, offset) {
  if (!log.messages.has(key) || !log.syncOffset.has(key)) {
    return []
  }
  const syncOffset = log.syncOffset.get(key)
  if (syncOffset <= offset) {
    return []
  }

  const arr = log.messages.get(key)
  const msgs = arr.slice(offset, syncOffset + 1)
  return msgs.map((msg, i) => [offset + i, msg])
}

function commitOffsets(key, offset) {
  if (!log.syncOffset.has(key)) {
    log.syncOffset.set(key, 0)
  }
  if (log.syncOffset.get(key) < offset) {
    log.syncOffset.set(key, offset)
  }
}

function getCommittedOffsets(key) {
  return log.syncOffset.get(key)
}

function handleReplication(entries) {
  Object.keys(entries).forEach(key => {
    // sync messages
    const msgs = entries[key]

    if (!log.messages.has(key)) {
      log.messages.set(key, new Array())
    }
    const localOffset = log.messages.get(key).length
    const remoteOffset = msgs.length

    if (localOffset < remoteOffset) {
      const arr = log.messages.get(key)
      arr.push(...msgs.slice(localOffset))
    }

    // sync offset
    let syncOffset = log.syncOffset.get(key) || 0
    if (syncOffset < msgs.length) {
      syncOffset = msgs.length
    }
    log.syncOffset.set(key, syncOffset)
  })
}

node.on('send', req => {
  const { key, msg } = req.body
  const offset = send(key, msg)

  node.reply(req, {
    type: 'send_ok',
    offset,
  })
})

node.on('poll', req => {
  const { offsets } = req.body
  const msgs = {}

  Object.keys(offsets).forEach(key => {
    const offset = offsets[key]
    msgs[key] = poll(key, offset)
  })

  node.reply(req, {
    type: 'poll_ok',
    msgs,
  })
})

node.on('commit_offsets', req => {
  const { offsets } = req.body

  Object.keys(offsets).forEach(key => {
    const offset = offsets[key]
    commitOffsets(key, offset)
  })

  node.reply(req, {
    type: 'commit_offsets_ok',
  })
})

node.on('list_committed_offsets', req => {
  const { keys } = req.body
  const offsets = {}

  keys.forEach(key => {
    offsets[key] = getCommittedOffsets(key)
  })

  node.reply(req, {
    type: 'list_committed_offsets_ok',
    offsets,
  })
})

node.on('replicate', req => {
  const { entries } = req.body
  handleReplication(entries)

  node.reply(req, {
    type: 'replicate_ok',
  })
})

setInterval(() => {
  node.nodeIds.forEach(peer => {
    if (peer === node.nodeId) {
      return
    }
    const diffs = log.diffs.get(peer)
    if (!diffs) {
      return
    }

    const entries = {}
    diffs.forEach((msgs, key) => {
      entries[key] = msgs
    })

    node.rpc(peer, {
      type: 'replicate',
      entries,
    }).catch(err => {
      console.error('replicate error', err)
    })
  })
}, 5000)
