const test = require('ava')
const {join} = require('node:path')
const {setTimeout} = require('node:timers/promises')

const {
  startServer,
  WSTester,
  _log
} = require('./common')

const {
  STATUS
} = require('../src/futu')

require('./shim')


test.serial('start integrated test', async t => {
  const {
    port,
    kill
  } = await startServer()

  const testers = []

  const {
    promise: testerPromise,
    resolve: testerResolve
  } = Promise.withResolvers()

  const tester1 = new WSTester(1, {
    port,
    t,
    onRequestCode: async () => {
      _log('onRequestCode')

      const tester2 = new WSTester(2, {
        port,
        t,
        checkStatus: false,
        sendCode: false,
        firstMessageType: 'REQUEST_CODE'
      })

      await tester2.ready()
      await tester2.init()

      testers.push(tester2.test())
    },
    onConnected: async () => {
      _log('onConnected')

      const tester3 = new WSTester(3, {
        port,
        t,
        checkStatus: false,
        sendCode: false,
        firstMessageType: 'CONNECTED'
      })

      await tester3.ready()
      await tester3.init()

      testers.push(tester3.test())
      testerResolve()
    }
  })

  await tester1.ready()
  await tester1.init()
  testers.push(tester1.test())

  await testerPromise

  await Promise.all(testers)

  tester1.send({
    type: 'VERIFY_CODE',
    code: '12345'
  })
  await setTimeout(100)

  kill()
})


test.serial('send verify code before init', async t => {
  const {
    port,
    kill
  } = await startServer({
    initCount: 2
  })

  const tester = new WSTester(1, {
    port,
    t,
    // checkStatus: false,
    sendCode: false
  })

  await tester.ready()

  tester.send({
    type: 'VERIFY_CODE',
    code: '12345'
  })

  await tester.init()

  await tester.equal({
    type: 'CONNECTED'
  })

  kill()
})


test.serial('auto init', async t => {
  const {
    port,
    kill
  } = await startServer({
    env: {
      FUTU_INIT_ON_START: 'yes'
    }
  })

  const tester = new WSTester(1, {
    port,
    t
  })

  await tester.ready()

  tester.send({
    type: 'STATUS'
  })

  await tester.equal({
    type: 'STATUS',
    status: STATUS.INIT
  })

  kill()
})


test.serial('spawn failed', async t => {
  const {
    port,
    kill
  } = await startServer({
    env: {
      FUTU_CMD: join(__dirname, 'common.js'),
      FUTU_INIT_ON_START: 'no',
      FUTU_SUPERVISE_PROCESS: 'no'
    }
  })

  const tester = new WSTester(1, {
    port,
    t
  })

  await tester.ready()
  await tester.init()

  await tester.equal({
    type: 'CLOSED'
  })

  kill()
})
