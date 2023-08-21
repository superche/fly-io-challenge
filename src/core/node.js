'use strict'

const { send } = require('../utils/network')
const { rl } = require('../utils/readline')

module.exports = class Node {
  constructor() {
    this.handlers = {
      init: this._handleInit,
    }
    this.nodeId = ''
    this.nodeIds = []
  }

  main = () => {
    rl.on('line', (line) => {
      console.warn('Got', line)
      this._handle(JSON.parse(line))
    });
  }

  reply = (req, data) => {
    const { msg_id } = req.body
    const body = {
      ...data,
      msg_id,
      in_reply_to: msg_id
    }

    send(this.nodeId, req.src, body)
  }

  on = (type, handler) => {
    this.handlers[type] = handler
  }

  _handle = async (req) => {
    try {
      const body = req.body
      const type = body.type

      const handler = this.handlers[type]
      if (handler === undefined) {
        console.warn('Don\'t know how to handle msg type', type, '(', req, ')');
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
