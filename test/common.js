const findFreePorts = require('find-free-ports')
const {WebSocket} = require('ws')
const {spawn} = require('node:child_process')
const {join} = require('node:path')
const fs = require('node:fs')
const _log = require('node:util').debuglog('futuopend')

const {
  STATUS
} = require('../src/futu')

const {
  FutuOpenDManager
} = require('../src/client')

require('./shim')


class Getter {
  constructor () {
    this.reset()
  }

  reset () {
    const {promise, resolve} = Promise.withResolvers()

    this._promise = promise
    this._resolve = resolve
  }

  set (value) {
    this._resolve(value)
  }

  async get () {
    const value = await this._promise

    this.reset()

    return value
  }
}


class WSTester {
  constructor (n, {
    port,
    t,
    onRequestCode,
    onConnected,
    checkStatus = STATUS.ORIGIN,
    sendCode = true,
    firstMessageType
  }) {
    this._n = n
    this._t = t
    this._onRequestCode = onRequestCode
    this._onConnected = onConnected
    this._checkStatus = checkStatus
    this._sendCode = sendCode
    this._firstMessageType = firstMessageType

    const ws = new WebSocket(`ws://localhost:${port}`)
    this._ws = ws

    const {
      promise,
      resolve
    } = Promise.withResolvers()
    this._openPromise = promise

    const getter = new Getter()
    this._getter = getter

    ws.on('message', msg => {
      const data = JSON.parse(msg)
      getter.set(data)
    })

    ws.on('open', () => {
      resolve()
    })
  }

  async equal (...args) {
    const data = await this._getter.get()

    this._t.deepEqual(data, ...args)
  }

  reset () {
    this._getter.reset()
  }

  _log (...msg) {
    _log(`[${this._n}]`, ...msg)
  }

  async ready () {
    await this._openPromise
  }

  send (msg) {
    this._ws.send(JSON.stringify(msg))
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

    this.send({
      type: 'INIT'
    })
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


const startServer = async ({
  // Set the initial count of futuopend.json
  initCount = 0,
  env = {}
} = {}) => {
  const storePath = join(__dirname, 'fixtures/futuopend.json')

  fs.writeFileSync(storePath, JSON.stringify({
    count: initCount
  }, null, 2))

  const [p1, port] = await findFreePorts(2)

  Object.assign(process.env, {
    FUTU_CMD: join(__dirname, 'fixtures/futuopend.js'),
    FUTU_LOGIN_ACCOUNT: 'test',
    FUTU_LOGIN_PWD_MD5: 'test',
    FUTU_LANG: 'en',
    FUTU_LOG_LEVEL: 'info',
    FUTU_PORT: p1,
    SERVER_PORT: port,
    FUTU_INIT_ON_START: 'no',
    FUTU_SUPERVISE_PROCESS: 'yes'
  }, env)

  const {
    promise: spawnPromise,
    resolve: spawnResolve
  } = Promise.withResolvers()

  const child = spawn(join(__dirname, '..', 'src', 'start.js'), {
    stdio: 'pipe'
  })

  let spawnOutput = ''

  child.stdout.on('data', data => {
    const content = data.toString()

    _log('data:', content)
    spawnOutput += content

    if (spawnOutput.includes('listening')) {
      spawnResolve()
    }
  })

  await spawnPromise

  return {
    port,
    kill: () => {
      child.kill()
    }
  }
}


module.exports = {
  startServer,
  WSTester,
  _log
}
