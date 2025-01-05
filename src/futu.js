const {WebSocketServer} = require('ws')
const pty = require('node-pty')

const STATUS = {
  ORIGIN: -1,
  INIT: 0,
  REQUESTING_VERIFICATION_CODE: 1,
  VERIFIYING_CODE: 2,
  CONNECTED: 3
}

const log = (...msg) => console.log('[FutuOpenD]', ...msg)
const error = (...msg) => console.error('[FutuOpenD][Err]', ...msg)

module.exports = class FutuManager {
  constructor (cmd, {
    login_account,
    login_pwd_md5,
    login_region,
    lang,
    log_level,
    api_port,
    server_port,
    auto_init = true
  }) {
    this._cmd = cmd
    this._login_account = login_account
    this._login_pwd_md5 = login_pwd_md5
    this._login_region = login_region
    this._lang = lang
    this._log_level = log_level
    this._api_port = api_port
    this._status = STATUS.ORIGIN

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
      ws.on('error', err => {
        error('ws error:', err)
      })

      ws.on('message', msg => {
        const payload = JSON.parse(msg)
        const {
          type,
          code
        } = payload

        if (type === 'VERIFY_CODE') {
          this.verify_code(code)
          return
        }

        if (type === 'INIT') {
          this._init()
          return
        }

        if (type === 'STATUS') {
          this._send({
            type: 'STATUS',
            status: this._status
          }, [ws])
          return
        }
      })
    })

    this._reset_ready_to_receive_code()

    if (auto_init) {
      this._init()
    }
  }

  _reset_ready_to_receive_code () {
    this._ready_to_receive_code = new Promise((resolve, reject) => {
      this._resolve = resolve
    })
  }

  _init () {
    if (this._status >= STATUS.INIT) {
      // Already inited
      return
    }

    this._status = STATUS.INIT

    this._child = pty.spawn(this._cmd, [
      `-login_account=${this._login_account}`,
      `-login_pwd_md5=${this._login_pwd_md5}`,
      `-login_region=${this._login_region}`,
      `-lang=${this._lang}`,
      `-log_level=${this._log_level}`,
      `-api_port=${this._api_port}`
    ], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    })

    this._child.on('data', chunk => {
      log('stdout:', chunk)

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

    this._child.on('exit', (code, signal) => {
      if (code !== 0) {
        error(`FutuOpenD exited with code: ${code}, signal: ${signal}`);
      } else {
        log(`FutuOpenD exited normally (code: ${code}, signal: ${signal})`);
      }
    })
  }

  _set_status (status) {
    this._status = status
    this._send({
      type: 'STATUS',
      status
    })
  }

  // Send msg to specific clients or all clients
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

    if (this._status === STATUS.CONNECTED) {
      // Already connected, no need to verify code
      return
    }

    this._ready_to_receive_code.then(() => {
      this._set_verify_code(code)
    })
  }

  _set_verify_code (code) {
    // this._ready.then might be called multiple times,
    //   so we need to test the current status again
    if (this._status !== STATUS.REQUESTING_VERIFICATION_CODE) {
      return
    }

    this._status = STATUS.VERIFIYING_CODE
    this._child.write(`input_phone_verify_code -code=${code}\r`)
  }
}
