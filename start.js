#!/usr/bin/env node

const env = require('@ostai/env')

const FutuManager = require('./src/futu')

const login_account = env('FUTU_LOGIN_ACCOUNT', env.required)
const login_pwd_md5 = env('FUTU_LOGIN_PWD_MD5', null, '')
const login_region = env('FUTU_LOGIN_REGION', env.required)
const lang = env('FUTU_LANG', env.required)
const log_level = env('FUTU_LOG_LEVEL', null, 'no')
const api_port = env('FUTU_PORT', env.integer, 11111)
const server_port = env('SERVER_PORT', env.integer, 80)

const FUTU_CMD = env('FUTU_CMD', env.required)

const futu = new FutuManager(FUTU_CMD, {
  login_account,
  login_pwd_md5,
  login_region,
  lang,
  log_level,
  api_port,
  server_port
})