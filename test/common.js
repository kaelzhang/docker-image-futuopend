const _log = require('node:util').debuglog('futuopend')
const findFreePorts = require('find-free-ports')
const {WebSocket} = require('ws')

const {
  STATUS,
  KEY_GETTER
} = require('../src/constants')

const {
  FutuOpenDManager
} = require('../src/manager')

const {
  startMockServer
} = require('../src/mock-server')

require('./shim')


class WSTester extends FutuOpenDManager {
  constructor (n, {
    port,
    t,
    onRequestCode,
    onConnected,
    checkStatus = STATUS.ORIGIN,
    sendCode = true,
    firstMessageType
  }) {
    super(`ws://localhost:${port}`)

    this._n = n
    this._t = t
    this._onRequestCode = onRequestCode
    this._onConnected = onConnected
    this._checkStatus = checkStatus
    this._sendCode = sendCode
    this._firstMessageType = firstMessageType
  }

  async equal (...args) {
    const data = await this[KEY_GETTER].get()

    this._t.deepEqual(data, ...args)
  }

  reset () {
    this[KEY_GETTER].reset()
  }

  _log (...msg) {
    _log(`[${this._n}]`, ...msg)
  }

  async init () {
    if (typeof this._checkStatus === 'number') {
      this.send({
        type: 'STATUS'
      })

      await this.equal({
        type: 'STATUS',
        status: this._checkStatus
      })
    }

    super.init()
  }

  async test () {
    const doInit = async n => {
      this._log('round 1 ...')

      if (
        !this._firstMessageType
        || this._firstMessageType === 'REQUEST_CODE'
        || n > 1
      ) {
        await this.equal({
          type: 'REQUEST_CODE'
        }, `REQUEST_CODE ${this._n}.${n}`)
      }

      if (this._onRequestCode) {
        await this._onRequestCode()
        this._onRequestCode = null
      }

      if (this._sendCode) {
        this.send({
          type: 'VERIFY_CODE',
          code: '12345'
        })
      }

      if (
        !this._firstMessageType
        || this._firstMessageType === 'CONNECTED'
        || this._firstMessageType === 'REQUEST_CODE'
        || n > 1
      ) {
        await this.equal({
          type: 'CONNECTED'
        }, `CONNECTED ${this._n}.${n}`)
      }

      if (this._onConnected) {
        await this._onConnected()
        this._onConnected = null
      }
    }

    await doInit(1)

    this._log('closed 1 ...')

    await this.equal({
      type: 'CLOSED'
    }, `CLOSED ${this._n}.1`)

    await doInit(2)

    this._log('closed 2 ...')

    await this.equal({
      type: 'CLOSED'
    }, `CLOSED ${this._n}.2`)

    await doInit(3)
  }
}


const startServer = async () => {
  const [port] = await findFreePorts(1)

  const kill = await startMockServer({
    port
  })

  return {
    port,
    kill
  }
}


module.exports = {
  WSTester,
  startServer,
  _log
}
