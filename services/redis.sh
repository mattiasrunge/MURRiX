#!/bin/bash -e

podman run -d --name redis-stack --network=host docker.io/redis/redis-stack:latest