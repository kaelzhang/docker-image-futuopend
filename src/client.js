const {WebSocket} = require('ws')

const {
  STATUS,
  KEY_GETTER
} = require('./constants')


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


class FutuOpenDManager {
  #url
  #ws
  #readyPromise
  #statusPromise
  #statusResolve

  constructor(url) {
    this.#url = url

    const getter = new Getter()
    this[KEY_GETTER] = getter

    this.#init()
  }

  #init () {
    this.#ws = new WebSocket(this.#url)

    const {promise, resolve} = Promise.withResolvers()
    this.#readyPromise = promise

    this.#ws.on('open', () => {
      resolve()
    })

    this.#ws.on('message', (msg) => {
      const data = JSON.parse(msg)

      if (data.type === 'STATUS') {
        this.#statusResolve(data.status)
      }

      this[KEY_GETTER].set(data)
    })
  }

  async ready () {
    return this.#readyPromise
  }

  send (msg) {
    this.#ws.send(JSON.stringify(msg))
  }

  // Send verification code to FutuOpenD
  sendCode (code) {
    this.send({
      type: 'VERIFY_CODE',
      code
    })
  }

  // Initialize FutuOpenD
  init () {
    this.send({
      type: 'INIT'
    })
  }

  // Get the status of FutuOpenD
  async status () {
    if (!this.#statusPromise) {
      const {promise, resolve} = Promise.withResolvers()

      this.#statusPromise = promise
      this.#statusResolve = resolve

      this.send({
        type: 'STATUS'
      })
    }

    const status = await this.#statusPromise
    this.#statusPromise = null

    return status
  }

  close (...args) {
    this.#ws.close(...args)
  }

  terminate () {
    this.#ws.terminate()
  }
}


module.exports = {
  STATUS,
  FutuOpenDManager
}
