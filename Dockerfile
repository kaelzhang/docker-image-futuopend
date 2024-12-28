# https://softwaredownload.futunn.com/Futu_OpenD_8.8.4818_Ubuntu16.04.tar.gz

FROM ubuntu:20.04

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y curl gnupg apt-utils \
  && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

ARG VERSION=8.8.4818_Ubuntu16.04

# AppData.dat
# FTWebSocket
# FutuOpenD
# FutuOpenD.xml
# libFTAPIChannel.so

RUN wget -O Futu_OpenD.tar.gz https://softwaredownload.futunn.com/Futu_OpenD_$VERSION.tar.gz \
&& tar -xf FutuOpenD.tar.gz && mkdir bin \
&& mv ./Futu_OpenD_${VERSION}/AppData.dat ./bin \
&& mv ./Futu_OpenD_${VERSION}/FTWebSocket ./bin \
&& mv ./Futu_OpenD_${VERSION}/FutuOpenD ./bin \
&& mv ./Futu_OpenD_${VERSION}/FutuOpenD.xml ./bin \
&& mv ./Futu_OpenD_${VERSION}/libFTAPIChannel.so ./bin \
&& rm -rf Futu_OpenD* \
&& chmod +x bin/FutuOpenD \
&& ls

RUN chmod +x ./bin/FutuOpenD

COPY package*.json ./

RUN npm i --omit=dev

# COPY ./src .
COPY . .

ENV FUTU_LOGIN_ACCOUNT=
ENV FUTU_LOGIN_PWD_MD5=
ENV FUTU_LOGIN_REGION=sh
ENV FUTU_LANG=en
ENV FUTU_LOG_LEVEL=no
ENV FUTU_PORT=11111
ENV SERVER_PORT=8000
ENV FUTU_CMD=/usr/src/app/bin/FutuOpenD

CMD [ "node", "/usr/src/app/start.js" ]
