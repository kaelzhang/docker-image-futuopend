const test = require('ava')
const {setTimeout} = require('node:timers/promises')

const {
  startServer,
  WSTester,
  _log
} = require('./common')


test('start integrated test', async t => {
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

