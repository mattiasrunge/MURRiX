#!/bin/bash -e

podman pull docker.io/library/mongo:latest
podman run -d --name mongodb -v ~/services/mongodb:/data/db --network=host docker.io/library/mongo:latest mongod
