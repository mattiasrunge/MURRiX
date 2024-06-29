#!/bin/bash -e

podman pull ghcr.io/mattiasrunge/nginx-harness:latest
podman run -d --name nginx-harness -v ~/services/nginx-harness:/storage --network=host ghcr.io/mattiasrunge/nginx-harness:latest
