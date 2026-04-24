#!/usr/bin/env python3
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
            pexpect.EOF,
            pexpect.TIMEOUT
        ], timeout=30)

        if idx == 0:  # 密码提示
            print("\n输入密码...")
            child.sendline(password)
        elif idx == 1:  # yes/no 确认
            child.sendline('yes')
        elif idx in [2, 3, 4]:  # 登录成功
            print("\n登录成功！")
            break
        elif idx == 5:  # EOF
            print("连接已关闭")
            break
        elif idx == 6:  # 超时
            print("连接超时")
            break

    # 进入交互模式
    child.interact()

if __name__ == "__main__":
    ssh_connect()
