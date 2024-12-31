# https://softwaredownload.futunn.com/Futu_OpenD_8.8.4818_Ubuntu16.04.tar.gz

FROM ostai/ubuntu-python:16.04-3.8

WORKDIR /usr/src/app

ARG FUTU_VERSION=8.8.4818_Ubuntu16.04

# Install FutuOpenD
RUN apt-get update \
&& apt-get install -y curl \
&& curl -o Futu_OpenD.tar.gz https://softwaredownload.futunn.com/Futu_OpenD_$FUTU_VERSION.tar.gz \
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

RUN pip install websockets env-get

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

CMD [ "python3.8", "/usr/src/app/src/start.py" ]
