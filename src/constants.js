const STATUS = {
  CLOSED: -2,
  ORIGIN: -1,
  INIT: 0,
  REQUESTING_VERIFICATION_CODE: 1,
  VERIFIYING_CODE: 2,
  CONNECTED: 3
}

const KEY_GETTER = Symbol('getter')


module.exports = {
  STATUS,
  KEY_GETTER
}
