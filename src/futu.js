const {WebSocketServer} = require('ws')
const pty = require('node-pty')

const {
  STATUS,
  OutputManager
} = require('./common')


class FutuManager {
  #cmd
  #login_account
  #login_pwd_md5
  #lang
  #log_level
  #api_port
  #status
  #supervise
  #retry
  #should_log
  #ws
  #clients
  #ready_to_receive_code
  #resolveReadyToReceiveCode
  #child
  #code
  #output

  constructor (cmd, {
    login_account,
    login_pwd_md5,
    lang,
    log_level,
    api_port,
    server_port,

    // Whether to auto-init the FutuOpenD process
    auto_init = true,

    // Whether to supervise the FutuOpenD process, and restart it if it closes
    supervise = true
  }) {
    this.#cmd = cmd
    this.#login_account = login_account
    this.#login_pwd_md5 = login_pwd_md5
    this.#lang = lang
    this.#log_level = log_level
    this.#api_port = api_port
    this.#status = STATUS.ORIGIN
    this.#supervise = supervise
    this.#retry = parseInt(
      // For testing purposes
      process.env.FUTU_RETRY,
      10
    ) || 0

    this.#should_log = log_level !== 'no'

    this.#ws = new WebSocketServer({port: server_port}, () => {
      this.#log(`WebSocket server is listening on port ${server_port}`)
    })

    this.#clients = []

    this.#ws.on('connection', ws => {
      if (this.#status === STATUS.REQUESTING_VERIFICATION_CODE) {
        this.#send({
          type: 'REQUEST_CODE'
        }, [ws])
      }

      if (this.#status === STATUS.CONNECTED) {
        this.#send({
          type: 'CONNECTED'
        }, [ws])
      }

      this.#clients.push(ws)
      ws.on('error', err => {
        this.#error('ws error:', err)
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
          this.#init()
          return
        }

        if (type === 'STATUS') {
          this.#send({
            type: 'STATUS',
            status: this.#status
          }, [ws])
          return
        }
      })
    })

    this.#reset_ready_to_receive_code()

    if (auto_init) {
      this.#init()
    }
  }

  #log(...msg) {
    if (this.#should_log) {
      console.log('[INFO]', ...msg)
    }
  }

  #error(...msg) {
    if (this.#should_log) {
      console.error('[ERROR]', ...msg)
    }
  }

  #reset_ready_to_receive_code() {
    this.#ready_to_receive_code = new Promise((resolve, reject) => {
      this.#resolveReadyToReceiveCode = resolve
    })
  }

  #init() {
    if (this.#status >= STATUS.INIT) {
      // Already inited
      return
    }

    this.#status = STATUS.INIT

    this.#log('Initializing FutuOpenD with options ...', {
      login_account: this.#login_account,
      login_pwd_md5: '<hidden>',
      lang: this.#lang,
      log_level: this.#log_level,
      api_port: this.#api_port
    })

    this.#child = pty.spawn(this.#cmd, [
      `-login_account=${this.#login_account}`,
      `-login_pwd_md5=${this.#login_pwd_md5}`,
      `-lang=${this.#lang}`,
      `-log_level=${this.#log_level}`,
      `-api_port=${this.#api_port}`
    ], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: {
        ...process.env,
        FUTU_RETRY: this.#retry
      }
    })

    this.#output = new OutputManager()

    this.#child.on('data', chunk => {
      process.stdout.write(chunk)
      this.#output.add(chunk)

      if (this.#output.includes('req_phone_verify_code')) {
        this.#send({
          type: 'REQUEST_CODE'
        })
        this.#status = STATUS.REQUESTING_VERIFICATION_CODE
        this.#resolveReadyToReceiveCode()
        return
      }

      if (this.#output.includes('Login successful')) {
        this.#send({
          type: 'CONNECTED'
        })
        this.#status = STATUS.CONNECTED
        this.#output.close()
      }
    })

    this.#child.on('error', err => {
      this.#error('FutuOpenD error:', err)
    })

    this.#child.on('exit', (code, signal) => {
      this.#error('FutuOpenD exited')
    })

    this.#child.on('close', () => {
      this.#log('FutuOpenD closed')

      this.#status = STATUS.CLOSED
      this.#send({
        type: 'CLOSED'
      })

      this.#reset_ready_to_receive_code()

      if (this.#supervise) {
        this.#retry++
        this.#init()
      }
    })
  }

  // Send msg to specific clients or all clients
  #send(msg, clients) {
    if (msg.type === 'REQUEST_CODE' && this.#code) {
      // Already has a code
      return
    }

    (clients || this.#clients).forEach(client => {
      client.send(JSON.stringify(msg))
    })
  }

  verify_code(code) {
    this.#code = code

    if (this.#status === STATUS.REQUESTING_VERIFICATION_CODE) {
      this.#set_verify_code()
      return
    }

    if (this.#status === STATUS.CONNECTED) {
      // Already connected, no need to verify code
      return
    }

    this.#ready_to_receive_code.then(() => {
      this.#set_verify_code()
    })
  }

  #set_verify_code() {
    const code = this.#code
    this.#code = undefined

    // this.#ready.then might be called multiple times,
    //   so we need to test the current status again
    if (this.#status !== STATUS.REQUESTING_VERIFICATION_CODE) {
      return
    }

    this.#status = STATUS.VERIFIYING_CODE
    this.#child.write(`input_phone_verify_code -code=${code}\r`)
  }
}


module.exports = {
  FutuManager,
  STATUS
}
