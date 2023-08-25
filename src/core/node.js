'use strict'

const { generateRPCMessageId } = require('../utils/id')
const { Network } = require('../utils/network')

module.exports = class Node {
  constructor() {
    this.handlers = {
      init: this._handleInit,
    }
    this.nodeId = ''
    this.nodeIds = []
    this.network = new Network()
    this.network.on('receive', this._handle)
  }

  reply = (req, data) => {
    const { msg_id } = req.body
    const body = {
      ...data,
      msg_id,
      in_reply_to: msg_id
    }

    this.network.send(this.nodeId, req.src, body)
      .catch(() => {
        // reply ignore error
      })
  }

  on = (type, handler) => {
    this.handlers[type] = handler
  }

  rpc = (dest, body) => {
    const body2 = {
      ...body,
      msg_id: generateRPCMessageId()
    }
    return this.network.send(this.nodeId, dest, body2)
  }

  rpcWithRetry = async (dest, body, retries = 50) => {
    while(true) {
      try {
        const responseBody = await this.rpc(dest, body)
        return responseBody
      } catch (err) {
        console.error('rpcWithRetry got error: ' + err)
      }
    }
  }

  _handle = async (req) => {
    try {
      const body = req.body
      const type = body.type

      const handler = this.handlers[type]
      if (handler === undefined) {
        console.warn('Don\'t know how to handle msg type', type, '(', req, ')')
        this.reply(req, {
          type: 'error',
          code: 10,
          text: 'unsupported request type ' + type
        })
      } else {
        await handler(req)
      }
    } catch (err) {
      console.warn('Error processing request', err)
      // this._maybeReplyError(req, err)
    }
  }

  _handleInit = (req) => {
    const body = req.body
    this.nodeId = body.node_id
    this.nodeIds = body.node_ids

    this.reply(req, {
      type: 'init_ok'
    })
  }

  // _maybeReplyError = () => {

  // }
}
