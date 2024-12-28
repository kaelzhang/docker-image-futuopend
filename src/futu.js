const {spawn} = require('child_process')

const {WebSocketServer} = require('ws')

const STATUS = {
  INIT: 0,
  REQUESTING_VERIFICATION_CODE: 1,
  VERIFIYING_CODE: 2,
  CONNECTED: 3
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
      if (this._status === STATUS.REQUESTING_VERIFICATION_CODE) {
        this._send({
          type: 'REQUEST_CODE'
        }, [ws])
      }

      if (this._status === STATUS.CONNECTED) {
        this._send({
          type: 'CONNECTED'
        }, [ws])
      }

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
    ])

    this._child.stdout.on('data', data => {
      console.log(
        '[FutuOpenD] stdout:',
        // Remove redundant new empty lines
        data.toString().replace(/(?:\s*(?:\r|\n)+)+/, '\n')
      )

      const chunk = data.toString()

      if (chunk.includes('req_phone_verify_code')) {
        this._send({
          type: 'REQUEST_CODE'
        })
        this._status = STATUS.REQUESTING_VERIFICATION_CODE
        this._resolve()
        return
      }

      if (chunk.includes('Login successful')) {
        this._send({
          type: 'CONNECTED'
        })
        this._status = STATUS.CONNECTED
        return
      }
    })

    this._child.stderr.on('data', (data) => {
      console.error('[FutuOpenD] process error:', data.toString())
    })

    this._child.on('error', err => {
      console.error('[FutuOpenD] process error:', err)
    })

    this._ready = new Promise((resolve, reject) => {
      this._resolve = resolve
    })
  }

  _send (msg, clients) {
    (clients || this._clients).forEach(client => {
      client.send(JSON.stringify(msg))
    })
  }

  verify_code (code) {
    this._code = code

    if (this._status === STATUS.REQUESTING_VERIFICATION_CODE) {
      this._set_verify_code(code)
      return
    }

    if (this._status === STATUS.INIT) {
      this._ready.then(() => {
        this._set_verify_code(code)
      })
    }

    // avoid verifying code in other status
  }

  _set_verify_code (code) {
    this._status = STATUS.VERIFIYING_CODE
    this._child.stdin.write(`input_phone_verify_code -code=${code}\n`)
    this._child.stdin.end()
  }
}
