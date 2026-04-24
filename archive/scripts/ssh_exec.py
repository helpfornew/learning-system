#!/usr/bin/env python3
import pexpect
import sys

def ssh_exec_command(command, timeout=60):
    host = "43.248.185.23"
    port = "46404"
    user = "root"
    password = "Han666"

    cmd = f"ssh -o StrictHostKeyChecking=no -p {port} {user}@{host} '{command}'"

    child = pexpect.spawn(cmd, timeout=timeout)
    child.logfile = sys.stdout.buffer

    idx = child.expect([
        b'[Pp]assword:',
        b'yes/no',
        pexpect.EOF,
        pexpect.TIMEOUT
    ], timeout=30)

    if idx == 0 or idx == 1:
        if idx == 1:
            child.sendline('yes')
            child.expect(b'[Pp]assword:', timeout=30)
        child.sendline(password)
        child.expect(pexpect.EOF, timeout=timeout)

    output = child.before.decode('utf-8', errors='ignore')
    return output

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        result = ssh_exec_command(cmd, timeout)
        print(result)
