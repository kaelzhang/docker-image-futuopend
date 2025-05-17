[English Version](./README.en.md)

# Docker Image 镜像: ostai/FutuOpenD

真正可用的 FutuOpenD docker 镜像。

之所以创建这个项目的原因，是因为我试过很多 FutuOpenD 的 docker 镜像，要么是根本无法运行起来，要么没有处理短信验证码，或者是需要我们手动 `docker exec` 到容器里面处理验证码，导致根本不能够运维。

容器启动后会运行：
- 一个 FutuOpenD agent
- 一个 websocket 服务器，用于检查 FutuOpenD agent 的就绪状态，并支持你提供短信验证码，来进行必要的初始化

该镜像始终使用 `DOCKER_DEFAULT_PLATFORM=linux/amd64` 构建（[why?](https://stackoverflow.com/questions/71040681/qemu-x86-64-could-not-open-lib64-ld-linux-x86-64-so-2-no-such-file-or-direc)）并可在 Ubuntu 和 MacOS 上运行。

## 安装

```sh
docker pull ostai/futuopend:latest
```

或者

```sh
docker pull ostai/futuopend:9.2.5208
```

## 当前 FutuOpenD 镜像版本

9.2.5208_Ubuntu16.04

## 用法

### 环境变量

- **FUTU_LOGIN_ACCOUNT** `string`（必填）
- **FUTU_LOGIN_PWD_MD5** `string`（必填）
- **FUTU_LOGIN_REGION** `string`，默认 `sh`
- **FUTU_LANG** `string`，默认 `chs`
- **FUTU_LOG_LEVEL** `string`，默认 `no`
- **FUTU_PORT** `integer`，FutuOpenD 的端口，默认 `11111`
- **SERVER_PORT** `integer`，websocket 服务器的端口，默认 `8000`
- **FUTU_INIT_ON_START** `string="yes"`，容器启动时是否初始化 Futu OpenD agent，默认 `"yes"`

### Docker Run：如何启动容器

```sh
docker run \
--name FutuOpenD \
-e "SERVER_PORT=8081" \
-p 8081:8081 \
-p 11111:11111 \
-e "FUTU_LOGIN_ACCOUNT=$your_futu_id" \
-e "FUTU_LOGIN_PWD_MD5=$your_password_md5" \
ostai/futuopend:latest
```

### WebSocket 服务器

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

  // 如果环境变量 FUTU_INIT_ON_START=no,
  // 我们需要手动初始化 FutuOpenD，让它启动
  ws.send(JSON.stringify({
    type: 'INIT'
  }))
})
```

下行和上行消息均为 JSON 格式。

#### 下行消息：服务器 -> 客户端

```json
{
  "type": "REQUEST_CODE"
}
```
表示 FutuOpenD agent 需要你提供短信验证码

```json
{
  "type": "CONNECTED"
}
```
表示 FutuOpenD agent 已连接

```json
{
  "type": "STATUS",
  "status": -1
}
```
服务器返回当前状态。

#### 上行消息：客户端 -> 服务器

```json
{
  "type": "INIT"
}
```
告诉服务器初始化 FutuOpenD agent，仅在环境变量 `FUTU_INIT_ON_START` 设置为 `'no'` 时有效

```json
{
  "type": "STATUS"
}
```
请求服务器返回当前状态

```json
{
  "type": "VERIFY_CODE",
  "code": "123456"
}
```
向 FutuOpenD agent 提交短信验证码

# 贡献者指南

## 如何构建你自己的镜像

```sh
export VERSION=9.2.5208
export FUTU_VERSION=${VERSION}_Ubuntu16.04
```

```sh
TAG=ostai/futuopend


docker build -t $TAG:$VERSION \
  --build-arg FUTU_VERSION=$FUTU_VERSION \
  .
```

例如:

```sh
docker build -t ostai/futuopend:${VERSION} \
  --build-arg FUTU_VERSION=${FUTU_VERSION} \
  .
```
