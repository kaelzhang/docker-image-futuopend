const {join} = require('node:path')
const {spawn} = require('node:child_process')
const log = require('node:util').debuglog('futuopend')

const startMockServer = async ({
  port,
  // Set the initial count of futuopend.json
  initRetry = 0,
  env: optionEnv = {}
}) => {
  if (initRetry) {
    optionEnv.FUTU_RETRY = initRetry
  }

  const env = Object.assign({
    FUTU_CMD: join(__dirname, '..', 'src', 'mock-futuopend.js'),
    FUTU_LOGIN_ACCOUNT: 'test',
    FUTU_LOGIN_PWD_MD5: 'test',
    FUTU_LANG: 'en',
    FUTU_LOG_LEVEL: 'info',
    // Fake port
    FUTU_PORT: 8080,
    SERVER_PORT: port,
    FUTU_INIT_ON_START: 'no',
    FUTU_SUPERVISE_PROCESS: 'yes'
  }, optionEnv)

  const {
    promise: spawnPromise,
    resolve: spawnResolve
  } = Promise.withResolvers()

  const spawnPath = join(__dirname, 'start.js')

  const child = spawn(spawnPath, {
    stdio: 'pipe',
    env: {
      ...process.env,
      ...env
    }
  })

  let spawnOutput = ''

  child.stdout.on('data', data => {
    const content = data.toString()

    log('stdout:', content)
    spawnOutput += content

    if (spawnOutput.includes('listening')) {
      spawnResolve()
    }
  })

  await spawnPromise

  return () => {
    child.kill()
  }
}

module.exports = {
  startMockServer
}
