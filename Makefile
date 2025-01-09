.PHONY: build

export FUTU_VERSION=8.8.4818

# Issue on Apple Silicon
# Ref: https://stackoverflow.com/questions/71040681/qemu-x86-64-could-not-open-lib64-ld-linux-x86-64-so-2-no-such-file-or-direc
build-osx:
	DOCKER_DEFAULT_PLATFORM=linux/arm64 docker build \
		--progress=plain \
		-t ostai/futuopend:$(FUTU_VERSION) \
  		--build-arg FUTU_VERSION=$(FUTU_VERSION)_Ubuntu16.04 \
		.

build:
	docker build \
		-t ostai/futuopend:$(FUTU_VERSION) \
  		--build-arg FUTU_VERSION=$(FUTU_VERSION)_Ubuntu16.04 \
		.

debug:
	docker run \
		--name FutuOpenD \
		-it \
		-p 8083:8083 \
		-p 11111:11111 \
		-e "FUTU_LOGIN_ACCOUNT=$(FUTU_LOGIN_ACCOUNT)" \
		-e "FUTU_LOGIN_PWD_MD5=$(FUTU_LOGIN_PWD_MD5)" \
		-e "FUTU_LOG_LEVEL=$(FUTU_LOG_LEVEL)" \
		-e "SERVER_PORT=8083" \
		ostai/futuopend:$(FUTU_VERSION)
