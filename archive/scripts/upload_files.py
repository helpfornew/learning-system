#!/usr/bin/env python3
"""
上传项目文件到服务器
"""
import pexpect
import sys
import os

def upload_files():
    host = "43.248.185.23"
    port = "46404"
    user = "root"
    password = "Han666"

    source_dir = "/home/ycx/learning_system"
    dest_dir = "/opt/learning-system"

    # 使用 rsync 通过 SSH
    rsync_cmd = (
        f"rsync -av -e 'ssh -p {port} -o StrictHostKeyChecking=no' "
        f"--exclude 'node_modules' --exclude '.git' --exclude '__pycache__' "
        f"--exclude '*.pyc' --exclude 'database/*.db' --exclude '.env' "
        f"--exclude 'mistake_system/mistake-system-desktop/node_modules' "
        f"--exclude 'desktop_app/node_modules' "
        f"--exclude 'release' --exclude 'dist' "
        f"{source_dir}/ {user}@{host}:{dest_dir}/"
    )

    print(f"上传文件到 {host}:{dest_dir}...")
    print(rsync_cmd)

    child = pexpect.spawn(rsync_cmd, timeout=600)
    child.logfile = sys.stdout.buffer

    idx = child.expect([
        b'[Pp]assword:',
        b'yes/no',
        b'permission denied',
        pexpect.EOF,
        pexpect.TIMEOUT
    ], timeout=30)

    if idx == 0 or idx == 1:
        if idx == 1:
            child.sendline('yes')
            child.expect(b'[Pp]assword:', timeout=30)
        child.sendline(password)

    # 等待完成
    try:
        child.expect(pexpect.EOF, timeout=600)
    except:
        pass

    print("\n传输完成！")
    return True

if __name__ == "__main__":
    upload_files()
