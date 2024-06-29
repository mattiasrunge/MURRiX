#!/bin/bash -e

podman pull docker.io/library/rabbitmq:latest
podman run -d --name rabbitmq -v ~/services/rabbitmq:/data/db --network=host docker.io/library/rabbitmq:latest
