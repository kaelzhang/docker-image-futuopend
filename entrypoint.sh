#!/bin/sh

FUTU_HOME="/usr/src/app/bin"

if [ -z "$FUTU_LOGIN_ACCOUNT" ]; then
	echo "env FUTU_LOGIN_ACCOUNT must be specified"
  exit 100
fi

if [ -z "$FUTU_LOGIN_PWD_MD5" ]; then
  if [ -n "$FUTU_LOGIN_PWD" ]; then
    echo "env FUTU_LOGIN_PWD_MD5 is preferred than FUTU_LOGIN_PWD"
    exit 100
  fi

	echo "env FUTU_LOGIN_PWD_MD5 must be specified"
  exit 100
fi

OPTIONS="-login_account=${FUTU_LOGIN_ACCOUNT} -login_pwd_md5=${FUTU_LOGIN_PWD_MD5} -login_region=${FUTU_LOGIN_REGION} -lang=${FUTU_LANG} -log_level=${FUTU_LOG_LEVEL} -api_port=80"

echo "OPTIONS: $OPTIONS"

$FUTU_HOME/FutuOpenD $OPTIONS
