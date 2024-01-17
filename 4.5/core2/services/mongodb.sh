#!/bin/bash -e

podman run -d --name mongodb --network=host docker.io/library/mongo:latest mongod
