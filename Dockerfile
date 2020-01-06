# https://softwarefile.futunn.com/FutuOpenD_22.8.700_Ubuntu16.04.tar.gz

FROM ubuntu

WORKDIR /usr/src/app

RUN apt-get update \
&& apt-get install -y wget \
&& rm -rf /var/lib/apt/lists/*

ARG VERSION=2.8.700_Ubuntu16.04

# AppData.dat
# FTWebSocket
# FutuOpenD
# FutuOpenD.xml
# libFTAPIChannel.so

RUN wget -O FutuOpenD.tar.gz https://softwarefile.futunn.com/FutuOpenD_$VERSION.tar.gz \
&& tar -xf FutuOpenD.tar.gz && mkdir bin \
&& mv ./FutuOpenD_${VERSION}/FutuOpenD ./bin \
&& mv ./FutuOpenD_${VERSION}/FutuOpenD.xml ./bin \
&& mv ./FutuOpenD_${VERSION}/FTWebSocket ./bin \
&& mv ./FutuOpenD_${VERSION}/AppData.dat ./bin \
&& mv ./FutuOpenD_${VERSION}/libFTAPIChannel.so ./bin \
&& rm -rf FutuOpenD* \
&& chmod +x bin/FutuOpenD \
&& ls

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

ENV FUTU_LOGIN_ACCOUNT=
ENV FUTU_LOGIN_PWD_MD5=
ENV FUTU_LOGIN_REGION=sh
ENV FUTU_LANG=chs
ENV FUTU_LOG_LEVEL=no

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
