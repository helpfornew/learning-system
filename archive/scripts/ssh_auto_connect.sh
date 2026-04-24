#!/usr/bin/expect -f

set timeout 300
spawn ssh -o StrictHostKeyChecking=no -p 46404 root@43.248.185.23
expect {
    "password:" {
        send "Han666\r"
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "Han666\r"
    }
}
expect eof
