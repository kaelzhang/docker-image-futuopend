const test = require('ava')
const fs = require('node:fs')
const {join} = require('node:path')
const {spawn} = require('node:child_process')
const log = require('node:util').debuglog('futuopend')

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

test('start integrated test', async t => {
  const storePath = join(__dirname, 'fixtures/futuopend.json')

  try {
    fs.unlinkSync(storePath)
  } catch (error) {
    // do nothing
  }

  const [p1, p2] = await findFreePorts(2)

  process.env.FUTU_CMD = join(__dirname, 'fixtures/futuopend.js')
  process.env.FUTU_LOGIN_ACCOUNT = 'test'
  process.env.FUTU_LOGIN_PWD_MD5 = 'test'
  process.env.FUTU_LANG = 'en'
  process.env.FUTU_LOG_LEVEL = 'info'
  process.env.FUTU_PORT = p1
  process.env.SERVER_PORT = p2
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

    log('data:', content)
    spawnOutput += content

    if (spawnOutput.includes('listening')) {
      spawnResolve()
    }
  })

  await spawnPromise

  const ws = new WebSocket(`ws://localhost:${p2}`)

  const {
    promise: wsPromise,
    resolve: wsResolve
  } = Promise.withResolvers()

  const getter = new Getter()

  ws.on('message', msg => {
    const data = JSON.parse(msg)

    getter.set(data)
  })


  ws.on('open', () => {
    log('open')
    wsResolve()
  })

  log('before await wsPromise')
  await wsPromise
  log('after await wsPromise')

  ws.send(JSON.stringify({
    type: 'STATUS'
  }))

  t.deepEqual(await getter.get(), {
    type: 'STATUS',
    status: STATUS.ORIGIN
  })

  ws.send(JSON.stringify({
    type: 'INIT'
  }))

  const doInit = async n => {
    log('round 1 ...')

    t.deepEqual(await getter.get(), {
      type: 'REQUEST_CODE'
    }, `REQUEST_CODE ${n}`)

    ws.send(JSON.stringify({
      type: 'VERIFY_CODE',
      code: '12345'
    }))

    t.deepEqual(await getter.get(), {
      type: 'CONNECTED'
    }, `CONNECTED ${n}`)
  }

  await doInit(1)

  log('closed 1 ...')

  t.deepEqual(await getter.get(), {
    type: 'CLOSED'
  })

  await doInit(2)

  log('closed 2 ...')

  t.deepEqual(await getter.get(), {
    type: 'CLOSED'
  })

  await doInit(3)

  child.kill()
})

