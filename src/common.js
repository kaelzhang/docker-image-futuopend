const {inspect} = require('node:util')

const STATUS = {
  CLOSED: -2,
  ORIGIN: -1,
  INIT: 0,
  REQUESTING_VERIFICATION_CODE: 1,
  VERIFIYING_CODE: 2,
  CONNECTED: 3
}

const KEY_GETTER = Symbol('getter')


class OutputManager {
  #output = ''
  #closed = false
  #max = 200

  add (chunk) {
    if (this.#closed) {
      return
    }

    this.#output += chunk

    const {length} = this.#output

    if (length > this.#max) {
      this.#output = this.#output.slice(length - this.#max)
    }
  }

  [inspect.custom] () {
    return this.#output
  }

  includes (str) {
    const index = this.#output.indexOf(str)

    if (!~ index) {
      return false
    }

    this.#output = this.#output.slice(index + str.length)
    return true
  }

  close () {
    this.#output = ''
    this.#closed = true
  }
}


module.exports = {
  STATUS,
  KEY_GETTER,
  OutputManager
}
