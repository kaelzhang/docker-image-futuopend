import asyncio
import json
import logging
import subprocess
from enum import IntEnum
from typing import (
    List,
    Optional,
    Set
)
import websockets

class Status(IntEnum):
    ORIGIN = -1
    INIT = 0
    REQUESTING_VERIFICATION_CODE = 1
    VERIFYING_CODE = 2
    CONNECTED = 3

class FutuManager:
    _process: Optional[subprocess.Popen]
    _code_future: Optional[asyncio.Future]
    _clients: Set[websockets.WebSocketServerProtocol]

    def __init__(
        self,
        cmd: str,
        login_account: str,
        login_pwd_md5: str,
        login_region: str,
        lang: str,
        log_level: str,
        api_port: int,
        server_port: int,
        auto_init: bool = True
    ):
        self._cmd = cmd
        self._login_account = login_account
        self._login_pwd_md5 = login_pwd_md5
        self._login_region = login_region
        self._lang = lang
        self._log_level = log_level
        self._api_port = api_port
        self._status = Status.ORIGIN
        self._server_port = server_port

        # Initialize logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('FutuOpenD')

        self._clients = set()
        self._process = None
        self._code_future = None
        self._reset_ready_to_receive_code()

        if auto_init:
            asyncio.create_task(self._init())

    def _reset_ready_to_receive_code(self):
        self._code_future = asyncio.Future()

    async def start_server(self):
        async with websockets.serve(self._handle_connection, 'localhost', self._server_port):
            await asyncio.Future()  # run forever

    async def _handle_connection(self, websocket):
        try:
            self._clients.add(websocket)

            if self._status == Status.REQUESTING_VERIFICATION_CODE:
                await self._send({'type': 'REQUEST_CODE'}, [websocket])

            if self._status == Status.CONNECTED:
                await self._send({'type': 'CONNECTED'}, [websocket])

            async for message in websocket:
                try:
                    payload = json.loads(message)
                    await self._handle_message(payload, websocket)
                except json.JSONDecodeError:
                    self.logger.error('Invalid JSON received')
                    continue

        except websockets.exceptions.ConnectionClosed:
            self.logger.info('Client disconnected')
        finally:
            self._clients.remove(websocket)

    async def _handle_message(self, payload: dict, websocket):
        message_type = payload.get('type')

        if message_type == 'VERIFY_CODE':
            await self.verify_code(payload.get('code'))
        elif message_type == 'INIT':
            await self._init()
        elif message_type == 'STATUS':
            await self._send({
                'type': 'STATUS',
                'status': self._status
            }, [websocket])

    async def _init(self):
        if self._status >= Status.INIT:
            return

        self._status = Status.INIT

        cmd_args = [
            self._cmd,
            f'-login_account={self._login_account}',
            f'-login_pwd_md5={self._login_pwd_md5}',
            f'-login_region={self._login_region}',
            f'-lang={self._lang}',
            f'-log_level={self._log_level}',
            f'-api_port={self._api_port}'
        ]

        self._process = subprocess.Popen(
            cmd_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
            bufsize=1
        )

        # Start reading stdout and stderr
        asyncio.create_task(self._read_stdout())
        asyncio.create_task(self._read_stderr())

    async def _read_stdout(self):
        assert self._process is not None

        while True:
            line = await asyncio.get_event_loop().run_in_executor(
                None, self._process.stdout.readline
            )
            if not line:
                break

            self.logger.info(f'stdout: {line.strip()}')

            if 'req_phone_verify_code' in line:
                await self._send({'type': 'REQUEST_CODE'})
                self._status = Status.REQUESTING_VERIFICATION_CODE
                self._code_future.set_result(None)

            elif 'Login successful' in line:
                await self._send({'type': 'CONNECTED'})
                self._status = Status.CONNECTED

    async def _read_stderr(self):
        assert self._process is not None
        while True:
            line = await asyncio.get_event_loop().run_in_executor(
                None, self._process.stderr.readline
            )
            if not line:
                break
            self.logger.error(f'stderr: {line.strip()}')

    async def _send(
        self,
        msg: dict,
        clients: Optional[List[websockets.WebSocketServerProtocol]] = None
    ):
        if clients is None:
            clients = self._clients

        message = json.dumps(msg)
        tasks = [client.send(message) for client in clients]
        if tasks:
            await asyncio.gather(*tasks)

    async def verify_code(self, code: str):
        if self._status == Status.REQUESTING_VERIFICATION_CODE:
            await self._set_verify_code(code)
            return

        if self._status == Status.CONNECTED:
            return

        await self._code_future
        await self._set_verify_code(code)

    async def _set_verify_code(self, code: str):
        if self._status != Status.REQUESTING_VERIFICATION_CODE:
            return

        self._status = Status.VERIFYING_CODE
        assert self._process is not None
        self._process.stdin.write(f'input_phone_verify_code -code={code}\n')
        self._process.stdin.flush()
        self._process.stdin.close()
