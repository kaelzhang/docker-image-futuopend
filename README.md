# kaelz/futuopend

Docker image for FutuOpenD on Ubuntu

## Image Versions

- **2.8.700**

## Environment Variables

- **FUTU_LOGIN_ACCOUNT** required
- **FUTU_LOGIN_PWD_MD5** required
- **FUTU_LOGIN_REGION** defaults to `sh`
- **FUTU_LANG** defaults to `chs`
- **FUTU_LOG_LEVEL** defaults to `no`

## How to build your own image

```sh
docker build -t $TAG:$VERSION --build-arg VERSION=$VERSION .
```

For example:

```sh
docker build -t kaelz/futuopend:2.8.700 --build-arg VERSION=2.8.700_Ubuntu16.04 .
```

or

```sh
# default VERSION is 2.8.700_Ubuntu16.04
docker build -t kaelz/futuopend:2.8.700 .
```

## How to start the container

```sh
docker run -it -p 11111:11111 \
-e "FUTU_LOGIN_ACCOUNT=$your_futu_id" \
-e "FUTU_LOGIN_PWD_MD5=$your_password_md5" kaelz/futuopend:$image_version
```

### For Mac

It is not easy to connect to a container from MacOS, to run `test.py` from MacOS, see:

- https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds
- https://github.com/docker/for-mac/issues/2670#issuecomment-372365274
