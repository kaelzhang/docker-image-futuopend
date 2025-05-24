const {
  setTimeout,
  clearTimeout
} = require('node:timers')
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
  #terminateAfterIdle
  #timer
  #ws
  #readyPromise
  #statusPromise
  #statusResolve

  constructor(url, {
    terminateAfterIdle = false
  } = {}) {
    this.#url = url
    this.#terminateAfterIdle = terminateAfterIdle

    const getter = new Getter()
    this[KEY_GETTER] = getter

    this.#init()
  }

  #resetTimer () {
    if (!this.#terminateAfterIdle) {
      return
    }

    if (this.#timer) {
      clearTimeout(this.#timer)
    }

    this.#timer = setTimeout(() => {
      if (this.#ws) {
        this.terminate()
        this.#ws = null
      }
    }, this.#terminateAfterIdle)
  }

  #init () {
    this.#ws = new WebSocket(this.#url)

    const {promise, resolve} = Promise.withResolvers()
    this.#readyPromise = promise

    this.#ws.on('open', () => {
      resolve()
    })

    this.#ws.on('message', (msg) => {
      this.#resetTimer()

      const data = JSON.parse(msg)

      if (data.type === 'STATUS') {
        if (this.#statusResolve) {
          this.#statusResolve(data.status)
          return
        }
      }

      this[KEY_GETTER].set(data)
    })

    this.#resetTimer()
  }

  async ready () {
    if (!this.#ws) {
      this.#init()
    }

    return this.#readyPromise
  }

  #send (msg) {
    this.#ws.send(JSON.stringify(msg))
    this.#resetTimer()
  }

  // Initialize FutuOpenD
  init () {
    this.#send({
      type: 'INIT'
    })
  }

  // Send verification code to FutuOpenD
  sendCode (code) {
    this.#send({
      type: 'VERIFY_CODE',
      code
    })
  }

  // Get the status of FutuOpenD
  async status () {
    if (!this.#statusPromise) {
      const {promise, resolve} = Promise.withResolvers()

      this.#statusPromise = promise
      this.#statusResolve = resolve

      this.#send({
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
