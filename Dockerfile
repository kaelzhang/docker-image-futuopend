# https://softwarefile.futunn.com/FutuOpenD_22.8.700_Ubuntu16.04.tar.gz

FROM ubuntu:16.04

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y curl gnupg apt-utils \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

ARG VERSION=7.2.3408_Ubuntu16.04

# AppData.dat
# FTWebSocket
# FutuOpenD
# FutuOpenD.xml
# libFTAPIChannel.so

# RUN wget -O FutuOpenD.tar.gz https://softwarefile.futunn.com/FutuOpenD_$VERSION.tar.gz \
# && tar -xf FutuOpenD.tar.gz && mkdir bin \
# && mv ./FutuOpenD_${VERSION}/FutuOpenD ./bin \
# && mv ./FutuOpenD_${VERSION}/FutuOpenD.xml ./bin \
# && mv ./FutuOpenD_${VERSION}/FTWebSocket ./bin \
# && mv ./FutuOpenD_${VERSION}/AppData.dat ./bin \
# && mv ./FutuOpenD_${VERSION}/libFTAPIChannel.so ./bin \
# && rm -rf FutuOpenD* \
# && chmod +x bin/FutuOpenD \
# && ls

# I have to add the futuopend binary code to the project, because the futuopend binary code is not available for download without signature.
COPY ./bin/* ./bin/

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
