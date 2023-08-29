const {spawn} = require('child_process')

const {WebSocketServer} = require('ws')

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
    api_port,
    server_port
  }) {
    this._cmd = cmd
    this._login_account = login_account
    this._login_pwd_md5 = login_pwd_md5
    this._login_region = login_region
    this._lang = lang
    this._log_level = log_level
    this._api_port = api_port

    this._ws = new WebSocketServer({port: server_port})
    this._clients = []

    this._ws.on('connection', ws => {
      this._clients.push(ws)
      ws.on('error', err => console.error)
      ws.on('message', msg => {
        const payload = JSON.parse(msg)

        if (payload.type === 'VERIFY_CODE') {
          this.verify_code(payload.code)
          return
        }
      })
    })

    this._init()
  }

  _init () {
    this._status = STATUS.INIT

    this._child = spawn(this._cmd, [
      `-login_account=${this._login_account}`,
      `-login_pwd_md5=${this._login_pwd_md5}`,
      `-login_region=${this._login_region}`,
      `-lang=${this._lang}`,
      `-log_level=${this._log_level}`,
      `-api_port=${this._api_port}`
    ], {
      // stdio: ['ignore', 'ignore', 'ignore']
    })

    this._child.stdout.on('data', data => {
      console.log('[FutuOpenD] stdout:', data.toString())

      if (data.toString().includes('req_phone_verify_code')) {
        this._send({
          type: 'REQUEST_VERIFY_CODE'
        })
        this._status = STATUS.REQUESTING_VERIFY_CODE
        this._resolve()
        return
      }
    })

    this._child.stderr.on('data', (data) => {
      console.error('[FutuOpenD] process error:', data.toString())
    })

    this._ready = new Promise((resolve, reject) => {
      this._resolve = resolve
    })
  }

  _send (msg) {
    this._clients.forEach(client => {
      client.send(JSON.stringify(msg))
    })
  }

  verify_code (code) {
    this._code = code

    if (this._status === STATUS.REQUESTING_VERIFY_CODE) {
      this._set_verify_code(code)
      return
    }

    if (this._status === STATUS.INIT) {
      this._ready.then(() => {
        this._set_verify_code(code)
      })
    }
  }

  _set_verify_code (code) {
    this._child.stdin.write(`input_phone_verify_code -code=${code}\n`)
    this._child.stdin.end()
  }

  // get is_ready () {
  //   return this._status === STATUS.CONNECTED
  // }

  // async ready () {
  //   return this._ready
  // }
}
