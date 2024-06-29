#!/bin/bash -e

podman pull docker.io/redis/redis-stack:latest
podman run -d --name redis-stack -v ~/services/redis:/data --network=host docker.io/redis/redis-stack:latest