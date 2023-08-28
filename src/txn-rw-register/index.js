#!/usr/bin/env node

const Node = require('../core/node')
const {
  copyState,
  getStateByRoot,
  writeStateToRoot,
} = require('./global-state')
const {
  mergeRoot,
  rootContext,
} = require('./transaction-manager')

const node = new Node()

/**
 * Apply a transaction to a state.
 * It copies the state, applies the transaction.
 * It returns the modified state and transaction.
 * @param {*} state 
 * @param {*} txn 
 * @returns 
 */
function applyTxn(state, txn) {
  const state2 = copyState(state)
  const txn2 = []
  for (const mop of txn) {
    const [f, k, v] = mop
    const value = state2.get(k)
    switch (f) {
      case 'r':
        txn2.push([f, k, value])
        break
      case 'w':
        const value2 = value === undefined ? [v] : [...value, v]
        state2.set(k, value2)
        txn2.push(mop)
        break
      default:
        // nothing
    }
  }

  return [state2, txn2]
}

const transact = rootContext(node, async (root, txn) => {
  const state = await getStateByRoot(node, root, txn)
  const [state2, txn2] = applyTxn(state, txn)
  const root2 = mergeRoot(root, await writeStateToRoot(node, state2, txn2))

  return {
    root: root2,
    result: txn2,
  }
})


node.on('txn', async req => {
  const txn2 = await transact(req.body.txn)
  node.reply(req, {
    type: 'txn_ok',
    txn: txn2,
  })
})
