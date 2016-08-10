﻿"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const $ = require("jquery");
const utils = require("lib/utils");
const loc = require("lib/location");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.loading = stat.create();
    this.gid = ko.observable(false);
    this.public = ko.observable(false);
    this.groupReadable = ko.observable(false);
    this.groupWritable = ko.observable(false);

    this.saveAccess = utils.co(function*() {
        if (this.gid() === false) {
            throw new Error("A group must be specified!");
        }

        if (this.nodepath().node().properties.gid !== this.gid()) {
            yield api.vfs.chown(this.nodepath().path, null, parseInt(this.gid(), 10), { recursive: true });
        }

        let mode = 0;

        mode += this.nodepath().node().properties.mode & parseInt("400", 8) ? parseInt("400", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("200", 8) ? parseInt("200", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("100", 8) ? parseInt("100", 8) : 0;
        mode += this.groupReadable() ? parseInt("040", 8) : 0;
        mode += this.groupWritable() ? parseInt("020", 8) : 0;
        mode += this.groupReadable() ? parseInt("010", 8) : 0;
        mode += this.public() ? parseInt("004", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("002", 8) ? parseInt("002", 8) : 0;
        mode += this.public() ? parseInt("001", 8) : 0;

        console.log(utils.modeString(this.nodepath().node().properties.mode), "=>", utils.modeString(mode));

        if (mode !== this.nodepath().node().properties.mode) {
            yield api.vfs.chmod(this.nodepath().path, mode.toString(8), { recursive: true });
        }
    }.bind(this));

    this.setAccess = () => {
        this.loading(true);
        this.saveAccess()
        .then(() => {
            this.loading(false);
            stat.printSuccess("Share settings saved successfully!");

            node.reload();
        })
        .catch((error) => {
            this.loading(false);
            stat.printError(error);
        });
    };

    this.whoHasAccess = ko.asyncComputed([], function*() {
        if (!this.nodepath()) {
            return [];
        }

        let list = [];

        this.gid();
        this.groupReadable();
        this.groupWritable();
        this.public();

        this.loading(true);

        list.push({
            name: yield api.auth.name(this.nodepath().node().properties.uid),
            uid: this.nodepath().node().properties.uid,
            type: "Owner"
        });

        if (this.public()) {
            list.push({
                name: "Everyone",
                type: "Read"
            });
        }

        if (this.gid() && this.groupReadable()) {
            let groupname = yield api.auth.gname(this.gid());
            let users = yield api.auth.userList(groupname);
            let type = this.groupWritable() ? "Read and write" : "Readable";

            for (let user of users) {
                list.push({
                    name: user.node.attributes.name,
                    uid: user.node.attributes.uid,
                    type: type
                });
            }
        }

        this.loading(false);

        return list;
    }.bind(this));

    this.gid(this.nodepath().node().properties.gid);
    this.public(this.nodepath().node().properties.mode & parseInt("004", 8));
    this.groupReadable(this.nodepath().node().properties.mode & parseInt("040", 8));
    this.groupWritable(this.nodepath().node().properties.mode & parseInt("020", 8));

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});