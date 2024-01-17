#!/bin/bash -e

sshfs -p 2222 -o IdentityFile=~/.ssh/id_rsa root@localhost:/ mnt2