#!/usr/bin/env python3
"""
SSH 连接脚本 - 连接到 43.248.185.23:46404
自动输入密码并进入交互模式
"""
import pexpect
import sys

def ssh_connect():
    host = "43.248.185.23"
    port = "46404"
    user = "root"
    password = "Han666"

    cmd = f"ssh -o StrictHostKeyChecking=no -p {port} {user}@{host}"
    print(f"正在连接到 {host}:{port}...")

    child = pexpect.spawn(cmd)
    child.logfile = sys.stdout.buffer

    while True:
        idx = child.expect([
            b'[Pp]assword:',
            b'yes/no',
            b'Welcome',
            b'#',
            b'$',
            b'permission denied',
            pexpect.EOF,
            pexpect.TIMEOUT
        ], timeout=30)

        if idx == 0:  # 密码提示
            child.sendline(password)
        elif idx == 1:  # yes/no 确认
            child.sendline('yes')
        elif idx in [2, 3, 4]:  # 登录成功
            print("\n登录成功！进入交互模式...\n")
            break
        elif idx == 5:  # 拒绝
            print("登录被拒绝")
            return
        elif idx == 6:  # EOF
            print("连接已关闭")
            return
        elif idx == 7:  # 超时
            print("连接超时")
            return

    # 进入交互模式
    try:
        child.interact()
    except Exception as e:
        print(f"交互模式错误：{e}")
        # 保持连接
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                child.sendline(line.rstrip('\n'))
                child.expect(pexpect.TIMEOUT, timeout=1)
            except KeyboardInterrupt:
                break

if __name__ == "__main__":
    ssh_connect()
