# https://softwaredownload.futunn.com/Futu_OpenD_8.8.4818_Ubuntu16.04.tar.gz

# ==============================================================================
# Stage 1: Build Python from Source
# ==============================================================================
FROM ostai/ubuntu-node:16.04-16 AS builder

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive

ARG PYTHON_VERSION=3.8.20

WORKDIR /usr/src

# Install Python
# ------------------------------------------------------------------------------

# Python is required to build node-gyp

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
wget \
build-essential \
libssl-dev \
zlib1g-dev \
libncurses5-dev \
libffi-dev \
libsqlite3-dev \
libreadline-dev \
libtk8.6 \
libgdbm-dev \
ca-certificates \
xz-utils \
&& rm -rf /var/lib/apt/lists/*

# Download and extract Python source
RUN wget https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz \
&& tar xzf Python-${PYTHON_VERSION}.tgz \
&& rm Python-${PYTHON_VERSION}.tgz

# Compile and install Python
WORKDIR /usr/src/Python-${PYTHON_VERSION}
RUN ./configure --enable-optimizations \
&& make -j "$(nproc)" \
&& make altinstall

# /end install python ----------------------------------------------------------

COPY package*.json ./

RUN npm i --omit=dev

# ==============================================================================
# Stage 2: Create Final Runtime Image
# ==============================================================================
FROM ostai/ubuntu-node:16.04-16

WORKDIR /usr/src/app

RUN apt-get update \
# We need ca-certificates to make HTTPS requests,
#   so we should install recommends when installing wget,
#   avoid using --no-install-recommends
&& apt-get install -y wget \
&& rm -rf /var/lib/apt/lists/* \
&& apt-get clean

ARG FUTU_VERSION=8.8.4818_Ubuntu16.04

RUN wget -O Futu_OpenD.tar.gz https://softwaredownload.futunn.com/Futu_OpenD_$FUTU_VERSION.tar.gz \
&& tar -xf Futu_OpenD.tar.gz --strip-components=1 \
&& mkdir bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/AppData.dat ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/FTWebSocket ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/FutuOpenD ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/FutuOpenD.xml ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libFTAPIChannel.so ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libf3cbasis.so ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libf3clog.so ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libf3clogin.so ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libf3cloguploader.so ./bin \
&& mv ./Futu_OpenD_${FUTU_VERSION}/libf3creport.so ./bin \
&& rm -rf Futu_OpenD* \
&& chmod +x bin/FutuOpenD \
&& ls

COPY --from=builder ./node_modules .

# COPY ./src .
COPY . .

ENV FUTU_LOGIN_ACCOUNT=
ENV FUTU_LOGIN_PWD_MD5=
ENV FUTU_LOGIN_REGION=sh
ENV FUTU_LANG=en
ENV FUTU_LOG_LEVEL=no
ENV FUTU_PORT=11111
ENV SERVER_PORT=8000
ENV FUTU_INIT_ON_START=yes
ENV FUTU_CMD=/usr/src/app/bin/FutuOpenD

CMD [ "node", "/usr/src/app/src/start.js" ]
