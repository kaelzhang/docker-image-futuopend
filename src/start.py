from env_get import env

from .futu import FutuManager

login_account = env('FUTU_LOGIN_ACCOUNT', env.required)
login_pwd_md5 = env('FUTU_LOGIN_PWD_MD5', None, '')
login_region = env('FUTU_LOGIN_REGION', env.required)
lang = env('FUTU_LANG', env.required)
log_level = env('FUTU_LOG_LEVEL', None, 'no')
api_port = env('FUTU_PORT', env.integer, 11111)
server_port = env('SERVER_PORT', env.integer, 80)
init_on_start = env('FUTU_INIT_ON_START', env.boolean, True)

FUTU_CMD = env('FUTU_CMD', env.required)

FutuManager(
    FUTU_CMD,
    login_account,
    login_pwd_md5,
    login_region,
    lang,
    log_level,
    api_port,
    server_port,
    auto_init = init_on_start
)
