#!/usr/bin/env node

const env = require('@ostai/env')
const {WebSocketServer} = require('ws')

const FutuManager = require('./src/futu')

const FUTU_LOGIN_ACCOUNT = env('FUTU_LOGIN_ACCOUNT', env.required)
const FUTU_LOGIN_PWD_MD5 = env('FUTU_LOGIN_PWD_MD5', null, '')
const FUTU_LOGIN_REGION = env('FUTU_LOGIN_REGION', env.required)
const FUTU_LANG = env('FUTU_LANG', env.required)
const FUTU_LOG_LEVEL = env('FUTU_LOG_LEVEL', null, 'no')
const FUTU_PORT = env('FUTU_PORT', env.integer, 11111)
const SERVER_PORT = env('')

const FUTU_CMD = env('FUTU_CMD', env.required)

// const ws = new WebSocketServer({port: SERVER_PORT})

