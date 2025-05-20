const test = require('ava')
const fs = require('node:fs')
const {join} = require('node:path')
const {spawn} = require('node:child_process')
const _log = require('node:util').debuglog('futuopend')

const findFreePorts = require('find-free-ports')
const {WebSocket} = require('ws')

const {
  STATUS
} = require('../src/futu')

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
    checkStatus = true,
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

  _log (...msg) {
    _log(`[${this._n}]`, ...msg)
  }

  async ready () {
    await this._openPromise
  }

  async init () {
    if (this._checkStatus) {
      this._ws.send(JSON.stringify({
        type: 'STATUS'
      }))

      this._t.deepEqual(await this._getter.get(), {
        type: 'STATUS',
        status: STATUS.ORIGIN
      })
    }

    this._ws.send(JSON.stringify({
      type: 'INIT'
    }))
  }

  async test () {
    const doInit = async n => {
      this._log('round 1 ...')

      if (
        !this._firstMessageType
        || this._firstMessageType === 'REQUEST_CODE'
        || n > 1
      ) {
        this._t.deepEqual(await this._getter.get(), {
          type: 'REQUEST_CODE'
        }, `REQUEST_CODE ${this._n}.${n}`)
      }

      if (this._onRequestCode) {
        await this._onRequestCode()
        this._onRequestCode = null
      }

      if (this._sendCode) {
        this._ws.send(JSON.stringify({
          type: 'VERIFY_CODE',
          code: '12345'
        }))
      }

      if (
        !this._firstMessageType
        || this._firstMessageType === 'CONNECTED'
        || this._firstMessageType === 'REQUEST_CODE'
        || n > 1
      ) {
        this._t.deepEqual(await this._getter.get(), {
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

    this._t.deepEqual(await this._getter.get(), {
      type: 'CLOSED'
    }, `CLOSED ${this._n}.1`)

    await doInit(2)

    this._log('closed 2 ...')

    this._t.deepEqual(await this._getter.get(), {
      type: 'CLOSED'
    }, `CLOSED ${this._n}.2`)

    await doInit(3)
  }
}


test('start integrated test', async t => {
  const storePath = join(__dirname, 'fixtures/futuopend.json')

  try {
    fs.unlinkSync(storePath)
  } catch (error) {
    // do nothing
  }

  const [p1, port] = await findFreePorts(2)

  process.env.FUTU_CMD = join(__dirname, 'fixtures/futuopend.js')
  process.env.FUTU_LOGIN_ACCOUNT = 'test'
  process.env.FUTU_LOGIN_PWD_MD5 = 'test'
  process.env.FUTU_LANG = 'en'
  process.env.FUTU_LOG_LEVEL = 'info'
  process.env.FUTU_PORT = p1
  process.env.SERVER_PORT = port
  process.env.FUTU_INIT_ON_START = 'no'
  process.env.FUTU_SUPERVISE_PROCESS = 'yes'

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

  const testers = []

  const {
    promise: testerPromise,
    resolve: testerResolve
  } = Promise.withResolvers()

  const tester1 = new WSTester(1, {
    port,
    t,
    onRequestCode: async () => {
      _log('onRequestCode')

      const tester2 = new WSTester(2, {
        port,
        t,
        checkStatus: false,
        sendCode: false,
        firstMessageType: 'REQUEST_CODE'
      })

      await tester2.ready()
      await tester2.init()

      testers.push(tester2.test())
    },
    onConnected: async () => {
      _log('onConnected')

      const tester3 = new WSTester(3, {
        port,
        t,
        checkStatus: false,
        sendCode: false,
        firstMessageType: 'CONNECTED'
      })

      await tester3.ready()
      await tester3.init()

      testers.push(tester3.test())
      testerResolve()
    }
  })

  await tester1.ready()
  await tester1.init()
  testers.push(tester1.test())

  await testerPromise

  await Promise.all(testers)

  child.kill()
})

