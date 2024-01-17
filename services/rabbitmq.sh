#!/bin/bash -e

podman run -d --name rabbitmq --network=host docker.io/library/rabbitmq:latest
