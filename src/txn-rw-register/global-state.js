const thunkStore = 'lww-kv' // last write win key-value store
const thunkCache = new Map() // thunkID -> value[]

let nextId = 0
function _newId(node) {
  const id = node.nodeId + '.' + nextId
  nextId += 1
  return id
}

/**
 * Getting a thunk from the lww-kv database
 * @param {*} node 
 * @param {*} id 
 * @returns 
 */
async function _getThunk(node, id) {
  const cached = thunkCache.get(id)
  if (cached !== undefined) {
    return cached
  }

  try {
    const body = await node.rpc(thunkStore, {
      type: 'read',
      key: id,
    })
    thunkCache.set(id, body.value)

    return body.value
  } catch (err) {
    if (err.code === 20) {
      return _getThunk(node, id)
    } else {
      throw err
    }
  }
}

/**
 * Write a thunk to the lww-kv database
 * @param {*} node 
 * @param {*} id 
 * @param {*} value
 * @returns 
 */
async function _writeThunk(node, id, value) {
  thunkCache.set(id, value)

  return node.rpc(thunkStore, {
    type: 'write',
    key: id,
    value,
  })
}

function _writeTxnKeys(txn) {
  const keys = new Set()
  for (const [f, k, v] of txn) {
    if (f === 'w') {
      keys.add(k)
    }
  }

  return keys
}

function _readTxnKeys(txn) {
  const keys = new Set()
  for (const [f, k, v] of txn) {
    keys.add(k)
  }

  return keys
}


/**
 * Read the state associated with the given root
 * @param {*} node 
 * @param {*} root 
 * @param {*} txn 
 * @returns 
 */
async function getStateByRoot(node, root, txn) {
  const reads = []
  const state = new Map()
  const keys = _readTxnKeys(txn)

  root.forEach((id, key) => {
    if (keys.has(key)) {
      const read = _getThunk(node, id).then(value => {
        state.set(key, value)
      })
      reads.push(read)
    }
  })
  await Promise.all(reads)

  return state
}

/**
 * Write the state associated with the given transactions to a new root
 * @param {*} node 
 * @param {*} state 
 * @param {*} txn 
 * @returns
 */
async function writeStateToRoot(node, state, txn) {
  const writes = []
  const root = new Map()
  const keys = _writeTxnKeys(txn)
  state.forEach((value, key) => {
    if (keys.has(key)) {
      const id = _newId(node)
      const write = _writeThunk(node, id, value).then(() => {
        root.set(key, id)
      })
      writes.push(write)
    }
  })
  await Promise.all(writes)

  return root
}

function copyState(m) {
  const m2 = new Map()
  m.forEach((v, k) => {
    m2.set(k, v)
  })

  return m2
}

exports.getStateByRoot = getStateByRoot
exports.writeStateToRoot = writeStateToRoot
exports.copyState = copyState
