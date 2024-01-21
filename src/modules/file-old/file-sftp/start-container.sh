#!/bin/bash -e

podman run --replace -it -p 2222:22 -v ~/mfs/files:/data/files:ro --name mfs-sftp mfs-sftp