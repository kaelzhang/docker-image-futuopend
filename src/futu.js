const {spawn} = require('child_process')

const STATUS = {
  INIT: 0,
  REQUESTING_VERIFY_CODE: 1,
  CONNECTED: 2
}

module.exports = class FutuManager {
  constructor (cmd, {
    login_account,
    login_pwd_md5,
    login_region,
    lang,
    log_level,
    api_port
  }) {
    this._status = STATUS.INIT
    this._child = spawn(cmd, [
      '-login_account', login_account,
      '-login_pwd_md5', login_pwd_md5,
      '-login_region', login_region,
      '-lang', lang,
      '-log_level', log_level,
      '-api_port', api_port
    ])

    this._child.stdout.on('data', data => {
      console.log('data', typeof(data), data)
    })

    this._ready = new Promise((resolve, reject) => {
      this._resolve = resolve
    })
  }

  verify_code (code) {
    this._code = code

    if (this._status === STATUS.REQUESTING_VERIFY_CODE) {
      this._set_verify_code(code)
    }
  }

  _set_verify_code (code) {
    this._child.stdin.write(`input_phone_verify_code -code=${code}`)
  }

  get is_ready () {
    return this._status === STATUS.CONNECTED
  }

  async ready () {
    return this._ready
  }
}
