const test = require('ava')
const fs = require('node:fs')
const {join} = require('node:path')
const {spawn} = require('node:child_process')

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
    stdio: 'inherit'
  })

  let spawnOutput = ''

  child.on('data', data => {
    spawnOutput += data.toString()

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
    console.log('open')
    wsResolve()
  })

  await wsPromise

  ws.send(JSON.stringify({
    type: 'STATUS'
  }))

  t.is(await getter.get(), {
    type: 'STATUS',
    status: STATUS.ORIGIN
  })

  // If env FUTU_INIT_ON_START=no, we need to manually init futu
  // ws.send(JSON.stringify({
  //   type: 'INIT'
  // }))

})

