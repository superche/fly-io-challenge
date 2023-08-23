const EventEmitter = require('events')
const readline = require('readline')
const { generateRPCMessageId } = require('./id')

const REQUEST_TIMEOUT_BY_MS = 1000
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

class Network extends EventEmitter {
  constructor() {
    super()

    this.replyHandlers = new Map()
    rl.on('line', line => {
      console.warn('Got', line)
      this._receive(JSON.parse(line))
    })
  }

  send = async (src, dest, body) => {
    if (body.msg_id === undefined) {
      body.msg_id = generateRPCMessageId()
    }
    const { msg_id, in_reply_to } = body
    const msg = {
      src,
      dest,
      body,
    }

    if (in_reply_to !== undefined) {
      console.warn('Sending', msg)
      console.log(JSON.stringify(msg))
      return Promise.resolve()
    }

    // request error handler
    const promise = new Promise((resolve, reject) => {
      const responseHandler = {
        resolve,
        reject,
      }
      this.replyHandlers.set(msg_id, responseHandler)
      // request timeout
      setTimeout(() => {
        this.replyHandlers.delete(msg_id)
        reject({
          type: 'error',
          in_reply_to: msg_id,
          code: 0,
          text: 'request timeout',
        })
      }, REQUEST_TIMEOUT_BY_MS)
    })

    // send request
    console.warn('Sending', msg)
    console.log(JSON.stringify(msg))

    return promise
  }

  _receive = async req => {
    try {
      const { in_reply_to, type } = req.body

      if (in_reply_to !== undefined) {
        const handler = this.replyHandlers.get(in_reply_to)

        if (handler) {
          this.replyHandlers.delete(in_reply_to)
          if (type === 'error') {
            handler.reject(body);
          } else {
            handler.resolve(body);
          }
        }
      }

      this.emit('receive', req)
    } catch (err) {
      console.warn('Error processing request', err)
    }
  }
}

exports.Network = Network
