# About

MURRiX is a specialized Content Management System. The intention is to have a tool where lives can be documented. MURRiX enables storing and organizing of photos, written texts, events etc.
All items in the database can be connected to people, things and should be positioned geographically as well as in time.

The aim is to visualize all this information in a way that is easy to understand and use. Photos and other content should always be accessible and not just stored away in a box somewhere where they are never looked at. By recording content from lives in a family a repository with the family history will be created where everyone in the family can view and add to the content.

Data is stored and represented by nodes in a virtual filesystem which are stored in a database. Nodes are things like locations, persons, albums, cameras etc. Things should, if applicable, always have a position in both space and time. Properties that represent an item are “who”, “with”, “when” and “where”. Examples of items are photos, logbook entries, events such as birth, death etc.

The main use case is for a family to share their common history and lives, a repository for pictures and a family tree. But MURRiX could also be used only as an online photo album if so desired.

MURRiX tries to leverage the latest technologies available and relies heavily on HTML5 which makes a newer browser a requirement. Javascript is used throughout the application, MongoDB as database, Node.js as backend and in the browser.

## Install node.js
```bash
do apt-get install -y build-essential
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Install and run mcs
*Tip: Run both mcs and MURRiX in [https://www.npmjs.com/package/pm2](PM2).*
```bash
git clone https://github.com/mattiasrunge/mcs
cd mcs
make req
make deps
cp conf/config.json.sample conf/config.json
./bin/mcs
```

## How to install
```bash
git clone https://github.com/mattiasrunge/MURRiX
cd MURRiX
make deps
```

## How to configure
In general no configuration options are needed but if something needs to be changed, the wanted options can be overridden by defining a config.json file and adding the paramters that needs to be changed. config.sample.json contains all available options, but a config.json should only contain the changed parameters.
```bash
cp conf/config.json.sample conf/config.json
nano -w conf/config.json
```

## How to start a server
```bash
./bin/core
```

## How to run the CLI client
```bash
./bin/cli
```

Now you can start your brower and access MURRiX at port 8080 if the configuration was not changed. The default admin username and password are: admin/admin

## Import from old MURRiX
This command assumes that the mongodb instance is the same on new and old. Three are four options for copy mode:
symlink - Create a symlink from the old file to the new location
rsymlink - Move the file to new location and create a symlink in the old location to the new file
link - Create a hard link from old file to new location (requires new and old locations to be on the same filesystem)
copy - Copy the old file to the new location (taking double the amount of space)
move - Move the old file to the new location (breaks the old system)

```bash
./bin/cli update import <old_mongodb_name> <path_to_old_files_directory> <copymode>
```
