const rootStore = 'lin-kv'
const rootKey = 'root'

// key -> global state ID (thunk ID)
let rootCache = new Map()

function _serializeMap(m) {
  const pairs = []
  m.forEach((value, key) => {
    pairs.push(key)
    pairs.push(value)
  })

  return pairs
}

function _deserializeMap(pairs) {
  const m = new Map()
  for (let i = 0; i < pairs.length; i += 2) {
    m.set(pairs[i], pairs[i + 1]) // key -> value
  }

  return m
}

function _copyRoot(m) {
  const m2 = new Map()
  m.forEach((value, key) => {
    m2.set(key, value)
  })

  return m2
}

async function _getRoot(node) {
  const notFoundValue = []

  let pairs = notFoundValue

  try {
    const body = await node.rpc(rootStore, {
      type: 'read',
      key: rootKey, 
    })
    pairs = body.value
  } catch (err) {
    if (err.code !== 20) {
      throw err
    }
    pairs = notFoundValue
  }

  return _deserializeMap(pairs)
}

async function _casRoot(node, root, root2) {
  try {
    await node.rpc(rootStore, {
      type: 'cas',
      key: rootKey,
      from: _serializeMap(root),
      to: _serializeMap(root2),
      create_if_not_exists: true, 
    })
  } catch (err) {
    if (err.code !== 22) {
      throw err
    }
    throw {
      code: 30,
      text: 'root changed during txn',
    }
  }
}

function mergeRoot(m1, m2) {
  const m = _copyRoot(m1)
  m2.forEach((value, key) => {
    m.set(key, value)
  })

  return m
}

function rootContext(node, cb) {
  const handler = async (...args) => {
    const root = rootCache
    let root2
    let result
    try {
      const {
        root: newRoot,
        result: newResult,
      } = await cb(root, ...args)
      root2 = newRoot
      result = newResult
    } catch (err) {
      // cb failed, no need to update root
      throw err
    }
    if (!root2) {
      return
    }

    try {
      await _casRoot(node, root, root2)
      rootCache = root2

      return result
    } catch (err) {
      console.warn('root outdated. refresh and retry')
      rootCache = await _getRoot(node)
      return handler(...args)
    }
  }

  return handler
}

exports.mergeRoot = mergeRoot
exports.rootContext = rootContext
