# Docker Image: kaelz/ FutuOpenD

Docker image for FutuOpenD on Ubuntu.

The container will start
- a FutuOpenD agent
- a websocket server which could help to check the ready status of the FutuOpend agent and make it possible for you to provide SMS verfication code.

```sh
docker pull kaelz/futuopend:latest
```

## Current FutuOpenD Image Version

8.8.4818_Ubuntu16.04

## Usage

### Environment Variables

- **FUTU_LOGIN_ACCOUNT** required
- **FUTU_LOGIN_PWD_MD5** required
- **FUTU_LOGIN_REGION** defaults to `sh`
- **FUTU_LANG** defaults to `chs`
- **FUTU_LOG_LEVEL** defaults to `no`
- **FUTU_PORT** `integer` the port of the FutuOpenD, defaults to `11111`
- **SERVER_PORT** `integer` the port of the websocket server, defaults to `8000`

### Docker Run: How to start the container

```sh
docker run \
--name FutuOpenD \
-e "SERVER_PORT=8081" \
-p 8081:8081 \
-p 11111:11111 \
-e "FUTU_LOGIN_ACCOUNT=$your_futu_id" \
-e "FUTU_LOGIN_PWD_MD5=$your_password_md5" \
kaelz/futuopend:latest
```

### WebSocket Server

- **type** `string` the type of the messages, including following types:
  - REQUEST_CODE: which means the FutuOpenD agent requires you to provide an SMS verification code
  - CONNECTED: which means the FutuOpenD agent is connected
  - STATUS: the server returns the current status to you

```js
const {WebSocket} = require('ws')

const ws = new WebSocket('ws://localhost:8081')

ws.on('message', msg => {
  const data = JSON.parse(msg)

  if (data.type === 'REQUEST_CODE') {
    ws.send(JSON.stringify({
      type: 'VERIFY_CODE',
      code: '12345'
    }))
    return
  }

  if (data.type === 'STATUS') {
    console.log('status:', data.status)
    return
  }
})

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'STATUS'
  }))

  // If env FUTU_INIT_ON_START=no, we need to manually init futu
  ws.send(JSON.stringify({
    type: 'INIT'
  }))
})
```

# For contributors

## How to build your own image

```sh
VERSION=8.8.4818
FUTU_VERSION="$VERSION"_Ubuntu16.04

docker build -t $TAG:$VERSION \
  --build-arg FUTU_VERSION=$FUTU_VERSION \
  .
```

For example:

```sh
docker build -t kaelz/futuopend:8.8.4818 \
  --build-arg FUTU_VERSION=8.8.4818_Ubuntu16.04 \
  .
```
