# kaelz/futuopend

Docker image for FutuOpenD on Ubuntu. The container will start a FutuOpenD agent and start a websocket server which could help which helps to check the ready status of futuopend and make it possible for you to provide SMS verfication code.

```sh
docker pull kaelz/futuopend:latest
```

## Current FutuOpenD Image Version

7.3.3508_Ubuntu16.04

## Environment Variables

- **FUTU_LOGIN_ACCOUNT** required
- **FUTU_LOGIN_PWD_MD5** required
- **FUTU_LOGIN_REGION** defaults to `sh`
- **FUTU_LANG** defaults to `chs`
- **FUTU_LOG_LEVEL** defaults to `no`
- **FUTU_PORT** defaults to `11111`
- **SERVER_PORT** `integer` the port of the websocket server

## How to start the container

```sh
docker run -it -p 11111:11111 \
-e "FUTU_LOGIN_ACCOUNT=$your_futu_id" \
-e "FUTU_LOGIN_PWD_MD5=$your_password_md5" kaelz/futuopend:latest
```

### For Mac

It is not easy to connect to a container from MacOS, to run `test.py` from MacOS, see:

- https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds
- https://github.com/docker/for-mac/issues/2670#issuecomment-372365274

# For contributors


## How to build your own image

```sh
docker build -t $TAG:$VERSION --build-arg .
```

For example:

```sh
docker build -t kaelz/futuopend:2.8.700 .
```
