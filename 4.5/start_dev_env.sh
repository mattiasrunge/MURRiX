#!/bin/bash -e

if [ ! "$(docker ps -a --format '{{.Names}}' | grep -w mongodb)" ]; then
    echo "Creating mongodb container"
    docker run -d -p 27017:27017 -v /tmp:/tmp --name mongodb mongo
    sleep 3
fi

echo "Starting mongodb container if it is not already started"
docker start mongodb
sleep 3

# echo "Dropping murrix_v4 database"
# docker exec -it mongodb mongo murrix_v4 --eval "db.dropDatabase()"

# echo "Creating dump of production database"
# ssh ada@sal.runge.se /home/ada/dump_murrix_db.sh
# rm -rf /tmp/murrix_db_dump

# echo "Copying database dump"
# scp -r ada@sal.runge.se:/tmp/murrix_db_dump /tmp
# # mv /tmp/murrix_db_dump/murrix_v4 /tmp/murrix_db_dump/murrix_v4

# echo "Importing database dump"
# docker exec -it mongodb mongorestore /tmp/murrix_db_dump

# echo "Removing database dump"
# rm -rf /tmp/murrix_db_dump/murrix_v4

echo "Ensuring data directories"
mkdir -p ~/murrix_data
mkdir -p ~/murrix_data/cache

echo "Mounting files from backup NAS"
if mount | grep /murrix_data/files > /dev/null; then
    echo "Already mounted"
else
    mkdir -p ~/murrix_data/files
    sudo sshfs -ossh_command="ssh -o IdentityFile=/home/$USER/.ssh/id_rsa" -o reconnect,allow_other,nonempty root@192.168.1.13:/c/data/archive ~/murrix_data/files
fi

if [ ! "$(docker ps -a | grep mcs)" ]; then
    echo "Creating mcs container"
    docker run -d -p 8181:8181 -v /home/$USER/murrix_data/cache:/home/$USER/murrix_data/cache -v /home/$USER/murrix_data/files:/home/$USER/murrix_data/files:ro --name mcs mattiasrunge/mcs
fi

echo "Starting mcs container if it is not already started"
docker start mcs

echo "All done!"
