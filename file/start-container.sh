#!/bin/bash -e

podman run --replace -it -p 9090:9090 -v ~/mfs:/data --name mfs mfs